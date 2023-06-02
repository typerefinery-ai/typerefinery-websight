package ai.typerefinery.websight.authentication.token;

import java.io.IOException;
import java.util.HashMap;
import javax.jcr.SimpleCredentials;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.api.security.authentication.token.TokenCredentials;
import org.apache.sling.auth.core.AuthUtil;
import org.apache.sling.auth.core.spi.AuthenticationHandler;
import org.apache.sling.auth.core.spi.AuthenticationInfo;
import org.apache.sling.auth.core.spi.DefaultAuthenticationFeedbackHandler;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(service = {AuthenticationHandler.class}, immediate = true, property = {"path=/", "service.ranking:Integer=200"})
@Designate(ocd = TokenAuthenticationHandlerConfig.class)
public class TokenAuthenticationHandler extends DefaultAuthenticationFeedbackHandler implements AuthenticationHandler {
  private static final Logger LOGGER = LoggerFactory.getLogger(TokenAuthenticationHandler.class);
  
  private static final String PAR_J_REASON = "j_reason";
  
  private String loginPage;

  private String domain;
  private String samesite;
  
  @Activate
  public void activate(TokenAuthenticationHandlerConfig config) {
    LOGGER.debug("Activating with config {}", config);
    AuthUtils.COOKIE_NAME = config.cookie_name();
    domain = config.cookie_domain();
    samesite = config.cookie_samesite();
    this.loginPage = config.login_page();
  }
  
  public AuthenticationInfo extractCredentials(HttpServletRequest request, HttpServletResponse response) {
    AuthenticationInfo authenticationInfo = getAuthenticationInfo(request, response);
    if (authenticationInfo == null) {
        authenticationInfo = getAuthenticationInfoFromCookie(request); 
    }
    if (authenticationInfo == null) {
        authenticationInfo = getAuthenticationInfoFromHeader(request); 
    }
    LOGGER.debug("Authentication info {}", authenticationInfo);
    return authenticationInfo;
  }
  
  public boolean authenticationSucceeded(HttpServletRequest request, HttpServletResponse response, AuthenticationInfo authInfo) {
    String token = AuthUtils.getToken(request);
    if (StringUtils.isBlank(token)) {
      token = AuthUtils.createToken(authInfo);
      if (StringUtils.isNotBlank(token))
        AuthUtils.updateTokenCookie(request, response, token, domain, samesite); 
    } 
    boolean result = false;
    if ("POST".equals(request.getMethod()) && request.getRequestURI()
      .endsWith("/j_security_check")) {
      String resource = AuthUtil.getLoginResource(request, null);
      if (AuthUtil.isRedirectValid(request, resource)) {
        try {
          response.sendRedirect(resource);
        } catch (IOException ioe) {
          LOGGER.error("Failed to send redirect to: " + resource, ioe);
        } 
        result = true;
      } 
    } 
    LOGGER.debug("Authentication succeeded: {}", Boolean.valueOf(result));
    return result;
  }
  
  public boolean requestCredentials(HttpServletRequest request, HttpServletResponse response) {
    if (StringUtils.isBlank(this.loginPage) || !AuthUtil.checkReferer(request, this.loginPage)) {
      LOGGER.debug("Login page is incorrect: {}", this.loginPage);
      return false;
    } 
    if (requestSystemActions(request)) {
      LOGGER.debug("Request system action.");
      return false;
    } 
    String resource = AuthUtil.setLoginResourceAttribute(request, request.getRequestURI());
    HashMap<String, String> params = new HashMap<>();
    params.put("resource", resource);
    if (request.getAttribute("j_reason") != null) {
      Object jReason = request.getAttribute("j_reason");
      String reason = (jReason instanceof Enum) ? ((Enum)jReason).name() : jReason.toString();
      params.put("j_reason", reason);
    } 
    try {
      AuthUtil.sendRedirect(request, response, this.loginPage, params);
    } catch (IOException e) {
      LOGGER.error("Failed to redirect to the login page " + this.loginPage, e);
    } 
    return true;
  }
  
  public void dropCredentials(HttpServletRequest request, HttpServletResponse response) {
    AuthUtils.updateTokenCookie(request, response, null);
  }
  
  public void authenticationFailed(HttpServletRequest request, HttpServletResponse response, AuthenticationInfo authInfo) {
    String token = AuthUtils.getToken(request);
    if (StringUtils.isNotBlank(token)) {
      request.setAttribute("j_reason", "SESSION_TIMEOUT");
    } else {
      request.setAttribute("j_reason", "INVALID_CREDENTIALS");
    } 
    dropCredentials(request, response);
  }
  
  private AuthenticationInfo getAuthenticationInfo(HttpServletRequest request, HttpServletResponse response) {
    AuthenticationInfo info = null;
    if (AuthUtils.isAuthenticationRequest(request)) {
      if (!AuthUtil.isValidateRequest(request)) {
        dropCredentials(request, response);
        AuthUtil.setLoginResourceAttribute(request, request.getContextPath());
      } 
      SimpleCredentials credentials = new SimpleCredentials(AuthUtils.getUsername(request), AuthUtils.getPassword(request).toCharArray());
      credentials.setAttribute(".token", "");
      info = AuthUtils.createAuthenticationInfo(credentials, request);
      info.put("$$auth.info.login$$", new Object());
    } 
    LOGGER.debug("Authentication info from request {}", info);
    return info;
  }
   
  private AuthenticationInfo getAuthenticationInfoFromHeader(HttpServletRequest request) {
    AuthenticationInfo info = null;
    String token = AuthUtils.getTokenHeader(request);
    if (StringUtils.isNotBlank(token)) {
      TokenCredentials tokenCredentials = new TokenCredentials(token);
      info = AuthUtils.createAuthenticationInfo(tokenCredentials, request);
    } 
    LOGGER.debug("Authentication info from header {}", info);
    return info;
  }
   
  private AuthenticationInfo getAuthenticationInfoFromCookie(HttpServletRequest request) {
    AuthenticationInfo info = null;
    String token = AuthUtils.getToken(request);
    if (StringUtils.isNotBlank(token)) {
      TokenCredentials tokenCredentials = new TokenCredentials(token);
      info = AuthUtils.createAuthenticationInfo(tokenCredentials, request);
    } 
    LOGGER.debug("Authentication info from cookie {}", info);
    return info;
  }
  
  private boolean requestSystemActions(HttpServletRequest request) {
    return request.getServletPath().endsWith(".action");
  }
}