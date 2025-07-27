package ukf.backend.Model.AllowedEmailDomain;

import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ukf.backend.Model.User.UserRepository;

@Service
@AllArgsConstructor
public class AllowedEmailDomainService {
    @Autowired
    private AllowedEmailDomainRepository repository;

}
