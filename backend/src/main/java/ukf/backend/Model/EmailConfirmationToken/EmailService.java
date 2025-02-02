package ukf.backend.Model.EmailConfirmationToken;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender sender;

    public EmailService(JavaMailSender sender) {
        this.sender = sender;
    }

    public void sendConfirmationEmail(EmailConfirmationToken emailConfirmationToken) throws MessagingException {
        //MIME - HTML message
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setTo(emailConfirmationToken.getUser().getEmail());
        helper.setSubject("Potvrďte svoj e-mail");
        helper.setText("<html>" +
                        "<body>" +
                        "<h2>Vážený/á "+ emailConfirmationToken.getUser().getName() + ",</h2>"
                        + "Prosím, kliknite na nižšie uvedený odkaz, aby ste potvrdili svoj účet."
                        + "<br/> "  + generateConfirmationLink(emailConfirmationToken.getToken())+"" +
                        "<br/>Škola" +
                        "</body>" +
                        "</html>"
                , true);
        sender.send(message);
    }
    private String generateConfirmationLink(String token){
        return "<a href=http://localhost:8080/confirm-email?token="+token+">Confirm Email</a>";
    }
}
