package io.typerefinery.websight.utils;


import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import javax.servlet.ServletOutputStream;

import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.wrappers.SlingHttpServletResponseWrapper;

/**
 * A wrapper around a {@link SlingHttpServletResponse} which buffers all output being written to {@link #getOutputStream()} or {@link #getWriter()}. The response cannot
 * be committed via {@link #flushBuffer} but only via {@link #close()}. Access to the underlying buffer is provided via
 * {@link #getBufferedServletOutput()}. 
 * <p/>
 * Hint: This servlet wrapper must extend {@link SlingHttpServletResponseWrapper}, as otherwise RequestData.unwrap() throws exceptions
 *
 */
public class BufferedSlingHttpServletResponse extends SlingHttpServletResponseWrapper implements Closeable {

    private final BufferedServletOutput bufferedOutput;

    public BufferedSlingHttpServletResponse(SlingHttpServletResponse wrappedResponse) {
        super(wrappedResponse);
        this.bufferedOutput = new BufferedServletOutput(wrappedResponse);
    }
    
    public BufferedSlingHttpServletResponse(SlingHttpServletResponse wrappedResponse, StringWriter writer, ByteArrayOutputStream outputStream) {
        super(wrappedResponse);
        this.bufferedOutput = new BufferedServletOutput(wrappedResponse, writer, outputStream);
    }

    @Override
    public ServletOutputStream getOutputStream() throws IOException {
        return bufferedOutput.getOutputStream();
    }

    @Override
    public PrintWriter getWriter() throws IOException {
        return bufferedOutput.getWriter();
    }

    @Override
    public void flushBuffer() throws IOException {
        bufferedOutput.flushBuffer();
    }

    @Override
    public void resetBuffer() {
        bufferedOutput.resetBuffer();
    }

    @Override
    public void close() throws IOException {
        bufferedOutput.close();
    }

    /**
     * @return the underlying wrapper around the buffered output
     */
    public BufferedServletOutput getBufferedServletOutput() {
        return bufferedOutput;
    }
}