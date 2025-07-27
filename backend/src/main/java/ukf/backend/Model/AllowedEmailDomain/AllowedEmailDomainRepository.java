package ukf.backend.Model.AllowedEmailDomain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ukf.backend.Model.User.User;

import java.util.Optional;

@Repository
public interface AllowedEmailDomainRepository extends JpaRepository<AllowedEmailDomain, Long> {

    Optional<AllowedEmailDomain> findByDomain(String domain);
}
