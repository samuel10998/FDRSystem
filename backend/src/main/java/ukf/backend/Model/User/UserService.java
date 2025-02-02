package ukf.backend.Model.User;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class UserService implements UserDetailsService{

    @Autowired
    private UserRepository repository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        Optional<User> user = repository.findByEmail(email);
        if (user.isPresent()) {
            var userObj = user.get();
            return org.springframework.security.core.userdetails.User.builder()
                    .username(userObj.getEmail())
                    .password(userObj.getPassword())
                    .build();
        }else{
            throw new UsernameNotFoundException(email);
        }
    }



}