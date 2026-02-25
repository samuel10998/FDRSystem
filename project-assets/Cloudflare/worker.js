export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // ---------- helpers ----------
        const json = (obj, status = 200) =>
            new Response(JSON.stringify(obj), {
                status,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            });

        const text = (msg, status = 200) =>
            new Response(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

        const badRequest = (msg) => text(msg || "Bad Request", 400);
        const unauthorized = () => text("Unauthorized", 401);
        const notFound = () => text("Not Found", 404);

        const safeId = (s) => typeof s === "string" && /^[A-Za-z0-9_-]+$/.test(s);
        const safeChunkName = (s) => typeof s === "string" && /^[A-Za-z0-9_.-]+$/.test(s);

        const requireSyncToken = () => {
            const auth = request.headers.get("Authorization") || "";
            return auth === `Bearer ${env.SYNC_TOKEN}`;
        };

        const parseDeviceKeys = () => {
            try {
                return JSON.parse(env.DEVICE_KEYS_JSON || "{}");
            } catch {
                return {};
            }
        };

        // ---------- routes ----------

        // Health check
        if (path === "/" && request.method === "GET") {
            return json({ ok: true, service: "FDR Cloud Inbox", routes: ["/upload", "/pending-flights", "/flight/...","/ack"] });
        }

        // A) DEVICE UPLOAD
        // PUT /upload
        // Headers:
        // X-DEVICE-ID, X-DEVICE-KEY, X-FLIGHT-ID, X-CHUNK-NUMBER
        if (path === "/upload" && request.method === "PUT") {
            const devId = request.headers.get("X-DEVICE-ID");
            const devKey = request.headers.get("X-DEVICE-KEY");
            const flightId = request.headers.get("X-FLIGHT-ID");
            const chunkNum = request.headers.get("X-CHUNK-NUMBER");

            if (!devId || !devKey || !flightId || !chunkNum) return badRequest("Missing required headers.");
            if (!safeId(devId) || !safeId(flightId)) return badRequest("Invalid deviceId/flightId format.");

            const keys = parseDeviceKeys();
            if (!keys[devId] || keys[devId] !== devKey) return unauthorized();

            const n = Number(chunkNum);
            if (!Number.isInteger(n) || n <= 0) return badRequest("Invalid X-CHUNK-NUMBER.");

            const padded = String(n).padStart(6, "0");
            const objectKey = `${devId}/${flightId}/${padded}.log`;

            const bodyText = await request.text();

            await env.INBOX_BUCKET.put(objectKey, bodyText, {
                httpMetadata: { contentType: "text/plain; charset=utf-8" },
            });

            return json({ ok: true, storedAs: objectKey });
        }

        // B1) SYNC: list pending flights for device
        // GET /pending-flights?deviceId=DEV
        // Auth: Authorization: Bearer SYNC_TOKEN
        if (path === "/pending-flights" && request.method === "GET") {
            if (!requireSyncToken()) return unauthorized();

            const devId = url.searchParams.get("deviceId");
            if (!devId || !safeId(devId)) return badRequest("Missing/invalid deviceId.");

            // list all objects under device prefix
            const prefix = `${devId}/`;
            const list = await env.INBOX_BUCKET.list({ prefix });

            // flightId -> { acked: boolean, chunks: number }
            const flights = new Map();

            for (const obj of list.objects) {
                const key = obj.key; // DEV/FLIGHT/000001.log or DEV/FLIGHT/_ACKED
                const parts = key.split("/");
                if (parts.length < 3) continue;

                const flightId = parts[1];
                const file = parts[2];

                const rec = flights.get(flightId) || { acked: false, chunks: 0 };
                if (file === "_ACKED") rec.acked = true;
                else if (file.endsWith(".log")) rec.chunks += 1;
                flights.set(flightId, rec);
            }

            const pending = [];
            for (const [flightId, rec] of flights.entries()) {
                if (!rec.acked && rec.chunks > 0) pending.push({ flightId, chunks: rec.chunks });
            }

            pending.sort((a, b) => a.flightId.localeCompare(b.flightId));

            return json({ ok: true, deviceId: devId, pending });
        }

        // B2) SYNC: get a specific file (chunk or meta) from a flight
        // GET /flight/{deviceId}/{flightId}/{fileName}
        // Auth: Authorization: Bearer SYNC_TOKEN
        if (path.startsWith("/flight/") && request.method === "GET") {
            if (!requireSyncToken()) return unauthorized();

            const parts = path.split("/").filter(Boolean); // ["flight", devId, flightId, fileName]
            if (parts.length !== 4) return badRequest("Invalid /flight path.");

            const [, devId, flightId, fileName] = parts;

            if (!safeId(devId) || !safeId(flightId)) return badRequest("Invalid deviceId/flightId.");
            if (!safeChunkName(fileName)) return badRequest("Invalid fileName.");

            const objectKey = `${devId}/${flightId}/${fileName}`;
            const obj = await env.INBOX_BUCKET.get(objectKey);
            if (!obj) return notFound();

            const headers = new Headers();
            obj.writeHttpMetadata(headers);
            headers.set("ETag", obj.httpEtag);

            return new Response(obj.body, { headers });
        }

        // B3) SYNC: ACK flight after successful local import
        // PUT /ack  body: { "deviceId": "...", "flightId": "..." }
        // Auth: Authorization: Bearer SYNC_TOKEN
        if (path === "/ack" && request.method === "PUT") {
            if (!requireSyncToken()) return unauthorized();

            const body = await request.json().catch(() => null);
            if (!body?.deviceId || !body?.flightId) return badRequest("Missing JSON fields deviceId/flightId.");

            const devId = body.deviceId;
            const flightId = body.flightId;
            if (!safeId(devId) || !safeId(flightId)) return badRequest("Invalid deviceId/flightId.");

            const ackKey = `${devId}/${flightId}/_ACKED`;
            await env.INBOX_BUCKET.put(ackKey, `ACKED ${new Date().toISOString()}\n`, {
                httpMetadata: { contentType: "text/plain; charset=utf-8" },
            });

            return json({ ok: true, ackKey });
        }

        return notFound();
    },
};