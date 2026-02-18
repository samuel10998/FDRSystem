    package ukf.backend.dtos.auth;

    import lombok.Data;
    import ukf.backend.Model.User.DeviceRequest;

    @Data
    public class RegisterRequest {
        private String name;
        private String surname;
        private String email;
        private String password;
        private String region;

        // optional – keď nepríde, defaultujeme na HAS_OWN_DEVICE
        private DeviceRequest deviceRequest;
    }