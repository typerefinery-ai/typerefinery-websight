package io.typerefinery.websight.utils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.servlet.ServletOutputStream;
import javax.servlet.WriteListener;

/**
 * Output stream for our fake HTTP response class
 *
 * {@link org.apache.sling.junit.scriptable.TestServletOutputStream}
 */
public class StringableOutputStream extends ServletOutputStream {

    private final ByteArrayOutputStream bos = new ByteArrayOutputStream();

    WriteListener writeListener = null;
    @Override
    public String toString() {
        return bos.toString();
    }

    @Override
    public void write(int b) throws IOException {
        bos.write(b);
    }
    //end

    @Override
    public boolean isReady() {
        return true;
    }

    @Override
    public void setWriteListener(WriteListener writeListener) {
        this.writeListener = writeListener;
    }
}