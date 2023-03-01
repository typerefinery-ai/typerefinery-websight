package io.typerefinery.websight.utils;

import java.io.PrintWriter;
import java.io.StringWriter;

import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.wrappers.SlingHttpServletResponseWrapper;

import org.osgi.annotation.versioning.ProviderType;

/**
 * Wrapper around {@link SlingHttpServletResponse} which buffers all output written to the writer
 * acquired via getWriter().
 * 
 * @deprecated Rather use {@link BufferedSlingHttpServletResponse} instead
 */
@ProviderType
@Deprecated
public final class StringWriterResponse extends SlingHttpServletResponseWrapper {
    private StringWriter stringWriter = new StringWriter();
    private PrintWriter printWriter = new PrintWriter(stringWriter);

    public StringWriterResponse(SlingHttpServletResponse slingHttpServletResponse) {
        super(slingHttpServletResponse);
    }

    public PrintWriter getWriter() {
        return printWriter;
    }

    public String getString() {
        return stringWriter.toString();
    }

    public void clearWriter() {
        printWriter.close();
        stringWriter = new StringWriter();
        printWriter = new PrintWriter(stringWriter);
    }
}