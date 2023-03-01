package io.typerefinery.websight.utils;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Collection;
import java.util.Locale;

import javax.servlet.ServletOutputStream;
import javax.servlet.WriteListener;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

/**
 * A fake response for making internal requests
 */
public class FakeResponse implements HttpServletResponse {

    private String charset;

    private String contentType;

    private ServletOutputStream outputStream;

    private PrintWriter printWriter;

    private final MessageDigest md;

    public FakeResponse(final OutputStream out) throws NoSuchAlgorithmException {

        md = MessageDigest.getInstance("MD5");

        outputStream = new ServletOutputStream() {

            @Override
            public void write(int b) throws IOException {
                out.write(b);
                md.update((byte) b);
            }

            @Override
            public void flush() throws IOException {
                out.flush();
            }

            @Override
            public void close() throws IOException {
                out.close();
            }

            @Override
            public boolean isReady() {
                // TODO Auto-generated method stub
                throw new UnsupportedOperationException("Unimplemented method 'isReady'");
            }

            @Override
            public void setWriteListener(WriteListener writeListener) {
                // TODO Auto-generated method stub
                throw new UnsupportedOperationException("Unimplemented method 'setWriteListener'");
            }
        };
    }

    @Override
    public void addCookie(Cookie cookie1) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void addDateHeader(String s, long l) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void addHeader(String s, String s1) {
        // NOOP since this is executed by the Sling Engine
    }

    @Override
    public void addIntHeader(String s, int i) {
        throw new UnsupportedOperationException();
    }

    @Override
    public boolean containsHeader(String name) {
        return false;
    }

    @Override
    public String encodeRedirectUrl(String url) {
        return null;
    }

    @Override
    public String encodeRedirectURL(String url) {
        return null;
    }

    @Override
    public String encodeUrl(String url) {
        return null;
    }

    @Override
    public String encodeURL(String url) {
        return null;
    }

    @Override
    public void flushBuffer() throws IOException {
        throw new UnsupportedOperationException();
    }

    @Override
    public int getBufferSize() {
        return 0;
    }

    @Override
    public String getCharacterEncoding() {
        return charset;
    }

    @Override
    public String getContentType() {
        return contentType;
    }

    @Override
    public Locale getLocale() {
        return null;
    }

    public String getMD5() {
        return new String(md.digest());
    }

    @Override
    public ServletOutputStream getOutputStream() throws IOException {
        return outputStream;
    }

    @Override
    public PrintWriter getWriter() throws IOException {
        if (printWriter == null) {
            Writer osWriter = new OutputStreamWriter(getOutputStream(), StandardCharsets.UTF_8);
            printWriter = new PrintWriter(osWriter, true);
        }
        return printWriter;
    }

    @Override
    public boolean isCommitted() {
        return false;
    }

    @Override
    public void reset() {
        // do nothing
    }

    @Override
    public void resetBuffer() {
        throw new UnsupportedOperationException();
    }

    @Override
    public void sendError(int i) throws IOException {
        throw new UnsupportedOperationException();
    }

    @Override
    public void sendError(int i, String s) throws IOException {
        throw new UnsupportedOperationException();
    }

    @Override
    public void sendRedirect(String s) throws IOException {
        throw new UnsupportedOperationException();
    }

    @Override
    public void setBufferSize(int i) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void setCharacterEncoding(String charset) {
        this.charset = charset;
    }

    @Override
    public void setContentLength(int i) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void setContentType(String type) {
        contentType = type;
    }

    @Override
    public void setDateHeader(String s, long l) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void setHeader(String s, String s1) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void setIntHeader(String s, int i) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void setLocale(Locale locale) {
        // do nothing
    }

    private int status;
    private String statusMessage;
    @Override
    public void setStatus(int i) {
        this.status = i;        
    }

    @Override
    public void setStatus(int i, String s) {
        // throw new UnsupportedOperationException();
        this.status = i;
        this.statusMessage = s;

    }

    private long contentLength;
    @Override
    public void setContentLengthLong(long len) {
        // // TODO Auto-generated method stub
        this.contentLength = len;
        // throw new UnsupportedOperationException("Unimplemented method 'setContentLengthLong'");
    }

    @Override
    public int getStatus() {
        // // TODO Auto-generated method stub
        // throw new UnsupportedOperationException("Unimplemented method 'getStatus'");
        return this.status;
    }

    @Override
    public String getHeader(String name) {
        // // TODO Auto-generated method stub
        // throw new UnsupportedOperationException("Unimplemented method 'getHeader'");
        return null;
    }

    @Override
    public Collection<String> getHeaders(String name) {
        // // TODO Auto-generated method stub
        // throw new UnsupportedOperationException("Unimplemented method 'getHeaders'");
        return null;
    }

    @Override
    public Collection<String> getHeaderNames() {
        // // TODO Auto-generated method stub
        // throw new UnsupportedOperationException("Unimplemented method 'getHeaderNames'");
        return null;
    }
}
