import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";
import axios from "axios";
import "./manageUsers.css";

export default function ManageUsers() {
    const [data, setData] = useState([]);
    const [roles, setRoles] = useState([]);
    const [filters, setFilters] = useState({});
    const [globalFilterValue, setGlobalFilterValue] = useState("");

    useEffect(() => {
        fetchData();
        fetchRoles();
        initFilters();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/users");
            const users = await Promise.all(
                response.data.map(async (user) => ({
                    id: user.id,
                    firstName: user.name,
                    lastName: user.surname,
                    email: user.email,
                    role: user.roles.map((role) => ({ id: role.id, name: role.name }))
                }))
            );
            setData(users);
        } catch (error) {
            console.error("Chyba pri načítaní používateľov:", error);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/roles");
            setRoles(response.data.map((role) => ({ label: role.name, value: role.id })));
        } catch (error) {
            console.error("Chyba pri načítaní rolí:", error);
        }
    };

    const patchUser = async (id, updatedFields) => {
        try {
            await axios.patch(`http://localhost:8080/api/users/${id}`, updatedFields);
        } catch (error) {
            console.error(error.response?.data || error.message);
        }
    };

    const onRowEditComplete = async (e) => {
        const { newData } = e;
        const updatedFields = {};
        const originalData = data.find((d) => d.id === newData.id);

        for (const key in newData) {
            if (newData[key] !== originalData[key]) {
                if (key === "role") {
                    updatedFields["roleIds"] = newData[key].map((role) => role.id);
                } else if (key === "firstName") {
                    updatedFields["name"] = newData[key];
                } else if (key === "lastName") {
                    updatedFields["surname"] = newData[key];
                } else if (key === "email") {
                    updatedFields["email"] = newData[key];
                }
            }
        }

        if (Object.keys(updatedFields).length > 0) {
            try {
                await patchUser(newData.id, updatedFields);
                const updatedData = data.map((d) =>
                    d.id === newData.id ? { ...d, ...newData } : d
                );
                setData(updatedData);
            } catch (error) {
                console.error(error.response?.data || error.message);
            }
        }
    };

    const initFilters = () => {
        setFilters({
            global: { value: "", matchMode: FilterMatchMode.CONTAINS },
            firstName: { value: "", matchMode: FilterMatchMode.CONTAINS },
            lastName: { value: "", matchMode: FilterMatchMode.CONTAINS },
            email: { value: "", matchMode: FilterMatchMode.CONTAINS },
            role: { value: [], matchMode: FilterMatchMode.IN }
        });
        setGlobalFilterValue("");
    };

    const clearFilters = () => {
        initFilters();
    };

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        const updatedFilters = {
            ...filters,
            global: { value, matchMode: FilterMatchMode.CONTAINS }
        };
        setGlobalFilterValue(value);
        setFilters(updatedFilters);
    };

    const roleEditor = (options) => (
        <MultiSelect
            value={options.value.map((role) => role.id)}
            options={roles}
            onChange={(e) =>
                options.editorCallback(
                    e.value.map((roleId) => {
                        const role = roles.find((r) => r.value === roleId);
                        return { id: role.value, name: role.label };
                    })
                )
            }
            placeholder="Vyberte rolu"
            display="chip"
            optionLabel="label"
        />
    );

    const textEditor = (options) => (
        <InputText
            type="text"
            value={options.value}
            onChange={(e) => options.editorCallback(e.target.value)}
        />
    );

    const handleDelete = async (userId) => {
        if (!window.confirm("Naozaj chcete odstrániť tohto používateľa?")) return;
        try {
            await axios.delete(`http://localhost:8080/api/users/${userId}`);
            setData(data.filter((user) => user.id !== userId));
        } catch (error) {
            console.error("Chyba pri odstraňovaní používateľa:", error);
        }
    };

    const actionBodyTemplate = (rowData) => (
        <Button
            label="Odstrániť"
            icon="pi pi-trash"
            className="delete-button"
            onClick={() => handleDelete(rowData.id)}
        />
    );

    const header = (
        <div className="header-container">
            <h3 className="header-title">Správa používateľov</h3>
            <div className="header-actions">
                <Button icon="pi pi-filter-slash" label="Vymazať filtre" onClick={clearFilters} />
                <InputText
                    className="global-search"
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    placeholder="Hľadať"
                />
            </div>
        </div>
    );

    return (
        <div className="manage-users-container">
            {header}
            <DataTable
                className="mu-table"
                value={data}
                editMode="row"
                onRowEditComplete={onRowEditComplete}
                paginator
                paginatorPosition="bottom"
                rows={8}
                dataKey="id"
                filters={filters}
                globalFilterFields={["firstName", "lastName", "email", "role.name"]}
                emptyMessage="Žiadne údaje neboli nájdené."
            >
                <Column field="firstName" header="Meno" editor={textEditor} sortable filter />
                <Column field="lastName" header="Priezvisko" editor={textEditor} sortable filter />
                <Column field="email" header="Email" editor={textEditor} sortable filter />
                <Column
                    field="role"
                    header="Rola"
                    editor={roleEditor}
                    body={(rowData) => rowData.role.map((r) => r.name).join(", ")}
                    filterField="role.name"
                />
                <Column header="Akcie" body={actionBodyTemplate} style={{ textAlign: "center", width: "120px" }} />
                <Column rowEditor headerStyle={{ width: "10%" }} bodyStyle={{ textAlign: "center" }} />
            </DataTable>
        </div>
    );
}
