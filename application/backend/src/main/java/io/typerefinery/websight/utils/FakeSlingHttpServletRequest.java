package io.typerefinery.websight.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.Principal;
import java.util.Collection;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.ResourceBundle;

import javax.servlet.AsyncContext;
import javax.servlet.DispatcherType;
import javax.servlet.RequestDispatcher;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletInputStream;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpUpgradeHandler;
import javax.servlet.http.Part;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.request.RequestDispatcherOptions;
import org.apache.sling.api.request.RequestParameter;
import org.apache.sling.api.request.RequestParameterMap;
import org.apache.sling.api.request.RequestPathInfo;
import org.apache.sling.api.request.RequestProgressTracker;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

public class FakeSlingHttpServletRequest implements SlingHttpServletRequest {

    @Override
    public String getAuthType() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getAuthType'");
    }

    @Override
    public Cookie[] getCookies() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getCookies'");
    }

    @Override
    public long getDateHeader(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getDateHeader'");
    }

    @Override
    public String getHeader(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getHeader'");
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getHeaders'");
    }

    @Override
    public Enumeration<String> getHeaderNames() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getHeaderNames'");
    }

    @Override
    public int getIntHeader(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getIntHeader'");
    }

    @Override
    public String getMethod() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getMethod'");
    }

    @Override
    public String getPathInfo() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getPathInfo'");
    }

    @Override
    public String getPathTranslated() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getPathTranslated'");
    }

    @Override
    public String getContextPath() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getContextPath'");
    }

    @Override
    public String getQueryString() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getQueryString'");
    }

    @Override
    public String getRemoteUser() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRemoteUser'");
    }

    @Override
    public boolean isUserInRole(String role) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isUserInRole'");
    }

    @Override
    public Principal getUserPrincipal() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getUserPrincipal'");
    }

    @Override
    public String getRequestedSessionId() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestedSessionId'");
    }

    @Override
    public String getRequestURI() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestURI'");
    }

    @Override
    public StringBuffer getRequestURL() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestURL'");
    }

    @Override
    public String getServletPath() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getServletPath'");
    }

    @Override
    public HttpSession getSession(boolean create) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getSession'");
    }

    @Override
    public HttpSession getSession() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getSession'");
    }

    @Override
    public String changeSessionId() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'changeSessionId'");
    }

    @Override
    public boolean isRequestedSessionIdValid() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isRequestedSessionIdValid'");
    }

    @Override
    public boolean isRequestedSessionIdFromCookie() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isRequestedSessionIdFromCookie'");
    }

    @Override
    public boolean isRequestedSessionIdFromURL() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isRequestedSessionIdFromURL'");
    }

    @Override
    public boolean isRequestedSessionIdFromUrl() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isRequestedSessionIdFromUrl'");
    }

    @Override
    public boolean authenticate(HttpServletResponse response) throws IOException, ServletException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'authenticate'");
    }

    @Override
    public void login(String username, String password) throws ServletException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'login'");
    }

    @Override
    public void logout() throws ServletException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'logout'");
    }

    @Override
    public Collection<Part> getParts() throws IOException, ServletException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getParts'");
    }

    @Override
    public Part getPart(String name) throws IOException, ServletException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getPart'");
    }

    @Override
    public <T extends HttpUpgradeHandler> T upgrade(Class<T> handlerClass) throws IOException, ServletException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'upgrade'");
    }

    @Override
    public Object getAttribute(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getAttribute'");
    }

    @Override
    public Enumeration<String> getAttributeNames() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getAttributeNames'");
    }

    @Override
    public String getCharacterEncoding() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getCharacterEncoding'");
    }

    @Override
    public void setCharacterEncoding(String env) throws UnsupportedEncodingException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'setCharacterEncoding'");
    }

    @Override
    public int getContentLength() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getContentLength'");
    }

    @Override
    public long getContentLengthLong() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getContentLengthLong'");
    }

    @Override
    public String getContentType() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getContentType'");
    }

    @Override
    public ServletInputStream getInputStream() throws IOException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getInputStream'");
    }

    @Override
    public String getParameter(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getParameter'");
    }

    @Override
    public Enumeration<String> getParameterNames() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getParameterNames'");
    }

    @Override
    public String[] getParameterValues(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getParameterValues'");
    }

    @Override
    public Map<String, String[]> getParameterMap() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getParameterMap'");
    }

    @Override
    public String getProtocol() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getProtocol'");
    }

    @Override
    public String getScheme() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getScheme'");
    }

    @Override
    public String getServerName() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getServerName'");
    }

    @Override
    public int getServerPort() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getServerPort'");
    }

    @Override
    public BufferedReader getReader() throws IOException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getReader'");
    }

    @Override
    public String getRemoteAddr() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRemoteAddr'");
    }

    @Override
    public String getRemoteHost() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRemoteHost'");
    }

    @Override
    public void setAttribute(String name, Object o) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'setAttribute'");
    }

    @Override
    public void removeAttribute(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'removeAttribute'");
    }

    @Override
    public Locale getLocale() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getLocale'");
    }

    @Override
    public Enumeration<Locale> getLocales() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getLocales'");
    }

    @Override
    public boolean isSecure() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isSecure'");
    }

    @Override
    public RequestDispatcher getRequestDispatcher(String path) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestDispatcher'");
    }

    @Override
    public String getRealPath(String path) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRealPath'");
    }

    @Override
    public int getRemotePort() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRemotePort'");
    }

    @Override
    public String getLocalName() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getLocalName'");
    }

    @Override
    public String getLocalAddr() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getLocalAddr'");
    }

    @Override
    public int getLocalPort() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getLocalPort'");
    }

    @Override
    public ServletContext getServletContext() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getServletContext'");
    }

    @Override
    public AsyncContext startAsync() throws IllegalStateException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'startAsync'");
    }

    @Override
    public AsyncContext startAsync(ServletRequest servletRequest, ServletResponse servletResponse)
            throws IllegalStateException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'startAsync'");
    }

    @Override
    public boolean isAsyncStarted() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isAsyncStarted'");
    }

    @Override
    public boolean isAsyncSupported() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isAsyncSupported'");
    }

    @Override
    public AsyncContext getAsyncContext() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getAsyncContext'");
    }

    @Override
    public DispatcherType getDispatcherType() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getDispatcherType'");
    }

    @Override
    public <AdapterType> @Nullable AdapterType adaptTo(@NotNull Class<AdapterType> type) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'adaptTo'");
    }

    @Override
    public @NotNull Resource getResource() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getResource'");
    }

    @Override
    public @NotNull ResourceResolver getResourceResolver() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getResourceResolver'");
    }

    @Override
    public @NotNull RequestPathInfo getRequestPathInfo() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestPathInfo'");
    }

    @Override
    public @Nullable RequestParameter getRequestParameter(@NotNull String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestParameter'");
    }

    @Override
    public @Nullable RequestParameter[] getRequestParameters(@NotNull String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestParameters'");
    }

    @Override
    public @NotNull RequestParameterMap getRequestParameterMap() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestParameterMap'");
    }

    @Override
    public @NotNull List<RequestParameter> getRequestParameterList() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestParameterList'");
    }

    @Override
    public @Nullable RequestDispatcher getRequestDispatcher(@NotNull String path, RequestDispatcherOptions options) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestDispatcher'");
    }

    @Override
    public @Nullable RequestDispatcher getRequestDispatcher(@NotNull Resource resource,
            RequestDispatcherOptions options) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestDispatcher'");
    }

    @Override
    public @Nullable RequestDispatcher getRequestDispatcher(@NotNull Resource resource) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestDispatcher'");
    }

    @Override
    public @Nullable Cookie getCookie(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getCookie'");
    }

    @Override
    public @Nullable String getResponseContentType() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getResponseContentType'");
    }

    @Override
    public @NotNull Enumeration<String> getResponseContentTypes() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getResponseContentTypes'");
    }

    @Override
    public @Nullable ResourceBundle getResourceBundle(Locale locale) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getResourceBundle'");
    }

    @Override
    public @Nullable ResourceBundle getResourceBundle(String baseName, Locale locale) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getResourceBundle'");
    }

    @Override
    public @NotNull RequestProgressTracker getRequestProgressTracker() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRequestProgressTracker'");
    }
    
}
