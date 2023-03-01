package io.typerefinery.websight.utils;

import java.io.IOException;
import java.io.OutputStream;

import javax.servlet.ServletOutputStream;
import javax.servlet.WriteListener;

/**
 * A {@link ServletOutputStream} based on a simple {@link OutputStream}. 
 * Always returns {@code true} for {@link #isReady()}.
 *
 */
public final class ServletOutputStreamWrapper extends ServletOutputStream {

    private final OutputStream wrappedStream;

    public ServletOutputStreamWrapper(OutputStream wrappedStream) {
        this.wrappedStream = wrappedStream;
    }
    
    @Override
    public boolean isReady() {
        return true;
    }

    @Override
    public void setWriteListener(WriteListener writeListener) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void write(byte[] b, int off, int len) throws IOException {
        wrappedStream.write(b, off, len);
    }

    @Override
    public void write(int b) throws IOException {
        wrappedStream.write(b);
    }

}
