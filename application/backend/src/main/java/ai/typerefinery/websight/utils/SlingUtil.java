package ai.typerefinery.websight.utils;



import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.text.StrSubstitutor;
import org.apache.jackrabbit.vault.util.JcrConstants;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.scripting.SlingScriptHelper;
import org.apache.sling.engine.SlingRequestProcessor;
// import org.apache.sling.engine.SlingRequestProcessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.NonNull;

import javax.jcr.*;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigInteger;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.MessageFormat;
import java.util.Calendar;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static java.text.MessageFormat.format;
import static org.apache.commons.lang3.StringUtils.isEmpty;
import static org.apache.commons.lang3.StringUtils.isNotEmpty;

import org.apache.sling.servlethelpers.internalrequests.SlingInternalRequest;

public class SlingUtil {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(PageUtil.class);


    public static String resourceRenderAsHtml(@NonNull String path, @NonNull ResourceResolver resourceResolver, @NonNull SlingRequestProcessor requestProcessor) {
        return resourceRender(path, "html", resourceResolver, requestProcessor);
    }

    public static String resourceRender(@NonNull String path, @NonNull String extension, @NonNull ResourceResolver resourceResolver, @NonNull SlingRequestProcessor requestProcessor) {
        try {

            String htmlString = "";
            String url = MessageFormat.format("{0}.{1}", path, extension);
            try {
                htmlString = (
                        new SlingInternalRequest(resourceResolver, requestProcessor, path)
                    )
                    .withExtension(extension)
                    .execute()
                    .getResponseAsString();

            } catch (IOException e) {
                LOGGER.warn("Exception retrieving contents for {}", url, e);
            }
            
            return htmlString;
        } catch (Exception e) {
            LOGGER.error("Error getting resource html", e);
        }
        return "";
    }
}
