package io.typerefinery.websight.utils;

import java.io.StringWriter;

import javax.servlet.RequestDispatcher;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.wrappers.SlingHttpServletRequestWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.typerefinery.websight.utils.BufferedServletOutput.ResponseWriteMethod;

import org.apache.commons.lang3.StringUtils;

/**
 * Used for Internal Forwarding of requests.
 */
public class SyntheticSlingHttpServletGetRequest extends SlingHttpServletRequestWrapper {
    private static final String METHOD_GET = "GET";

    private static final Logger LOGGER = LoggerFactory.getLogger(SyntheticSlingHttpServletGetRequest.class);

    // //default to disabled wcmmode
    // private String queryString = "?wcmmode=disabled";
    // private String method = METHOD_GET;

    public SyntheticSlingHttpServletGetRequest(final SlingHttpServletRequest request) {
        super(request);
    }

    @Override
    public String getMethod() {
        return METHOD_GET;
    }

    @Override
    public String getQueryString() {
        return "?wcmmode=disabled";
    }

    // public void setQueryString(String queryString) {
    //     this.queryString = queryString;
    // }

    // public void setMethod(String method) {
    //     this.method = method;
    // }

    public static String getIncludeAsString(final String path, final SlingHttpServletRequest slingRequest,
                                        final SlingHttpServletResponse slingResponse) {
        BufferedSlingHttpServletResponse responseWrapper = null;

        try {
            responseWrapper = new BufferedSlingHttpServletResponse(slingResponse, new StringWriter(), null);
            // options
            SlingHttpServletRequest syntheticRequest = new SyntheticSlingHttpServletGetRequest(slingRequest);
            final RequestDispatcher requestDispatcher = syntheticRequest.getRequestDispatcher(path);
            

            requestDispatcher.include(syntheticRequest, responseWrapper);
            if (responseWrapper.getBufferedServletOutput().getWriteMethod() == ResponseWriteMethod.WRITER) {
                return StringUtils.stripToNull(responseWrapper.getBufferedServletOutput().getBufferedString());
            }
        } catch (Exception ex) {
            LOGGER.error("Error creating the String representation for: " + path, ex);
            ex.printStackTrace();
        }

        return null;
    }
}