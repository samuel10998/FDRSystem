package ukf.backend.Model.User;

import jakarta.mail.MessagingException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.keygen.BytesKeyGenerator;
import org.springframework.security.crypto.keygen.KeyGenerators;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ukf.backend.Exception.InvalidTokenException;
import ukf.backend.Model.EmailConfirmationToken.EmailConfirmationToken;
import ukf.backend.Model.EmailConfirmationToken.EmailConfirmationTokenRepository;
import ukf.backend.Model.EmailConfirmationToken.EmailService;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository repository;

    private final EmailService emailService;
    private final EmailConfirmationTokenRepository emailConfirmationTokenRepository;

    private static final BytesKeyGenerator DEFAULT_TOKEN_GENERATOR = KeyGenerators.secureRandom(15);

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        Optional<User> user = repository.findByEmail(email);
        if (user.isPresent()) {
            var userObj = user.get();
            var authorities = userObj.getRoles().stream()
                    .map(role -> new SimpleGrantedAuthority(role.getName()))
                    .collect(Collectors.toList());

            return org.springframework.security.core.userdetails.User.builder()
                    .username(userObj.getEmail())
                    .password(userObj.getPassword())
                    .authorities(authorities)
                    .build();
        } else {
            throw new UsernameNotFoundException(email);
        }
    }

    public void sendRegistrationConfirmationEmail(User user) throws MessagingException {
        String tokenValue = Base64.getUrlEncoder().encodeToString(DEFAULT_TOKEN_GENERATOR.generateKey());

        EmailConfirmationToken emailConfirmationToken = new EmailConfirmationToken();
        emailConfirmationToken.setToken(tokenValue);
        emailConfirmationToken.setTimeStamp(LocalDateTime.now());
        emailConfirmationToken.setUser(user);

        emailConfirmationTokenRepository.save(emailConfirmationToken);
        emailService.sendConfirmationEmail(emailConfirmationToken);
    }

    /**
     * IMPORTANT: Transactional so token.getUser() works reliably (LAZY relation),
     * and save/delete happen in one unit of work.
     */
    @Transactional
    public boolean verifyUser(String token) throws InvalidTokenException {

        if (token == null || token.isBlank()) {
            throw new InvalidTokenException("Token is not valid");
        }

        EmailConfirmationToken emailConfirmationToken = emailConfirmationTokenRepository.findByToken(token);

        if (Objects.isNull(emailConfirmationToken) || !token.equals(emailConfirmationToken.getToken())) {
            throw new InvalidTokenException("Token is not valid");
        }

        // This can throw LazyInitializationException if not in transaction
        User user = emailConfirmationToken.getUser();

        if (Objects.isNull(user)) {
            return false;
        }

        user.setAccountVerified(true);
        repository.save(user);

        emailConfirmationTokenRepository.delete(emailConfirmationToken);

        log.info("Email verified: userId={}, email={}", user.getId(), user.getEmail());
        return true;
    }

    public User getByEmail(String email) {
        return repository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
