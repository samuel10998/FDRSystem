package ukf.backend;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.file.*;

@Component
public class AvatarInitializer implements ApplicationRunner {

    private static final Path AVATAR_DIR = Paths.get("uploads", "avatars");
    private static final String FILE_NAME = "profile_picture_default.jpg";

    private final ResourceLoader resourceLoader;

    public AvatarInitializer(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        Path target = AVATAR_DIR.resolve(FILE_NAME);

        if (Files.notExists(target)) {
            Files.createDirectories(AVATAR_DIR);

            try (InputStream in = resourceLoader
                    .getResource("classpath:static/" + FILE_NAME)
                    .getInputStream()) {

                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                System.out.println("✅  Default avatar nakopírovaný do " + target);
            }
        }
    }
}
