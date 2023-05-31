package ai.typerefinery.websight.authentication.token;

import java.util.Base64;
import javax.jcr.SimpleCredentials;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.api.security.authentication.token.TokenCredentials;
import org.apache.sling.auth.core.spi.AuthenticationInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AuthUtils {
  private static final Logger LOGGER = LoggerFactory.getLogger(AuthUtils.class);
  
  public static String COOKIE_NAME = "websight.auth";
  
  public static final String REQUEST_URL_SUFFIX = "/j_security_check";
  
  public static final String REQUEST_METHOD = "POST";
  
  public static final String ATTR_TOKEN = ".token";
  
  private static final String ATTR_NAME_TOKEN = "websight-token";
  
  private static final String PAR_J_USERNAME = "j_username";
  
  private static final String PAR_J_PASSWORD = "j_password";
  
  private static final String ATTR_REFERER = "referer";
  
  private static final String JCR_CREDENTIALS = "user.jcr.credentials";
  
  private static final String JCR_CREDENTIALS_USER = "user.name";
  
  private static final String AUTH_TYPE = "TOKEN";
  
  public static boolean isAuthenticationRequest(HttpServletRequest request) {
    return ("POST".equals(request.getMethod()) && request.getRequestURI()
      .endsWith("/j_security_check") && request
      .getParameter("j_username") != null && request
      .getParameter("j_password") != null);
  }
  
  public static AuthenticationInfo createAuthenticationInfo(SimpleCredentials credentials, HttpServletRequest request) {
    String referrer = request.getHeader("referer");
    if (referrer != null)
      credentials.setAttribute("referer", referrer); 
    AuthenticationInfo info = new AuthenticationInfo("TOKEN");
    info.put("user.jcr.credentials", credentials);
    info.put("user.name", credentials.getUserID());
    return info;
  }
  
  public static AuthenticationInfo createAuthenticationInfo(TokenCredentials credentials, HttpServletRequest request) {
    String referrer = request.getHeader("referer");
    if (referrer != null)
      credentials.setAttribute("referer", referrer); 
    AuthenticationInfo info = new AuthenticationInfo("TOKEN");
    info.put("user.jcr.credentials", credentials);
    return info;
  }
  
  public static String getTokenHeader(HttpServletRequest request) {
    String token = (String)request.getHeader("websight-token");
    if (StringUtils.isBlank(token)) {
      String cookieToken = getCookie(request, COOKIE_NAME);
      if (StringUtils.isNotBlank(cookieToken))
        token = new String(Base64.getDecoder().decode(cookieToken)); 
      request.setAttribute("websight-token", token);
    } 
    LOGGER.debug("Token {} found", token);
    return token;
  }
    
  public static String getToken(HttpServletRequest request) {
    String token = (String)request.getAttribute("websight-token");
    if (StringUtils.isBlank(token)) {
      String cookieToken = getCookie(request, COOKIE_NAME);
      if (StringUtils.isNotBlank(cookieToken))
        token = new String(Base64.getDecoder().decode(cookieToken)); 
      request.setAttribute("websight-token", token);
    } 
    LOGGER.debug("Token {} found", token);
    return token;
  }
  
  public static void updateTokenCookie(HttpServletRequest request, HttpServletResponse response, String token) {
    request.setAttribute("websight-token", token);
    updateTokenCookie(request, response, token, null, null);
    LOGGER.debug("Token {} updated", token);
  }

  public static void updateTokenCookie(HttpServletRequest request, HttpServletResponse response, String token, String domain, String sameSite) {
    request.setAttribute("websight-token", token);
    setCookie(request, response, COOKIE_NAME, token, StringUtils.isNotBlank(token) ? -1 : 0, domain, sameSite);
    setAuthToken(response, token);
    LOGGER.debug("Token {} updated", token);
  }
  
  public static String createToken(AuthenticationInfo authInfo) {
    String token = null;
    Object credentials = authInfo.get("user.jcr.credentials");
    if (credentials instanceof SimpleCredentials) {
      Object tokenObject = ((SimpleCredentials)credentials).getAttribute(".token");
      if (tokenObject != null)
        token = tokenObject.toString(); 
    } else if (credentials instanceof TokenCredentials) {
      token = ((TokenCredentials)credentials).getToken();
    } 
    LOGGER.debug("Token {} created!", token);
    return token;
  }
  
  private static String getCookie(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null)
      for (Cookie cookie : cookies) {
        if (cookie.getName().equals(name) && StringUtils.isNotBlank(cookie.getValue()))
          return cookie.getValue(); 
      }  
    return null;
  }
  
  private static void setAuthToken(HttpServletResponse response, String token) {
        response.setHeader("websight-token", token);
  }

  private static void setCookie(HttpServletRequest request, HttpServletResponse response, String name, String value, int age, String domain, String sameSite) {
    String ctxPath = request.getContextPath();
    String cookiePath = (ctxPath == null || ctxPath.length() == 0) ? "/" : ctxPath;
    StringBuilder header = new StringBuilder();
    String cookieString = (value != null) ? Base64.getEncoder().encodeToString(value.getBytes()) : value;
    header.append(name).append("=").append(cookieString);
    header.append("; Path=").append(cookiePath);
    header.append("; HttpOnly");
    if (StringUtils.isNotBlank(domain)) {
      header.append("; Domain=").append(domain); 
    }
    if (age >= 0) {
      header.append("; Max-Age=").append(age); 
    }
    if (request.isSecure()) {
      header.append("; Secure"); 
      if (StringUtils.isNotBlank(sameSite)) {
        header.append("; SameSite=").append("none"); 
      }
    }
    LOGGER.debug("Cookie {} set", header);
    response.addHeader("Set-Cookie", header.toString());
    response.addHeader("Set-Cookie", "test=auth;");
  }
  
  public static String getUsername(HttpServletRequest request) {
    return request.getParameter("j_username");
  }
  
  public static String getPassword(HttpServletRequest request) {
    return request.getParameter("j_password");
  }
}