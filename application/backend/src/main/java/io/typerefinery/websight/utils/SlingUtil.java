package io.typerefinery.websight.utils;



import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.text.StrSubstitutor;
import org.apache.jackrabbit.vault.util.JcrConstants;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.scripting.SlingScriptHelper;
// import org.apache.sling.engine.SlingRequestProcessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.math.BigInteger;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Calendar;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static java.text.MessageFormat.format;
import static org.apache.commons.lang3.StringUtils.isEmpty;
import static org.apache.commons.lang3.StringUtils.isNotEmpty;


public class SlingUtil {
    

    
    // /***
    //  * render a resource path as HTML to include in components that reuse content in other resources.
    //  * @param path path to resources
    //  * @param resourceResolver resource resolver for request
    //  * @param sling sling helper
    //  * @param mode mode to request resource with
    //  * @param requestAttributeName attribute name to set requestAttributes into
    //  * @param requestAttributes requestAttributes to set into requestAttributeName
    //  * @param appendHTMLExtention append .html to end of path
    //  * @return html string of output
    //  * 
    //  *    resourceRenderAsHtml(
    //  *         dialogPath,
    //  *         adminResourceResolver,
    //  *         slingScriptHelper,
    //  *         WCMMode.DISABLED,
    //  *         null,
    //  *         null,
    //  *         false);
    //  *         
    //  */
    // @SuppressWarnings("unchecked")
    // public static String resourceRenderAsHtml(String path, ResourceResolver resourceResolver, SlingScriptHelper sling, WCMMode mode, String requestAttributeName, ComponentProperties requestAttributes, boolean appendHTMLExtention) {
    //     if (isEmpty(path) || resourceResolver == null || sling == null) {
    //         String error = format(
    //                 "resourceRenderAsHtml5: params not specified path=\"{0}\",resourceResolver=\"{1}\",sling=\"{2}\""
    //                 , path, resourceResolver, sling);
    //         LOGGER.error(error);
    //         return "<!--".concat(error).concat("-->");
    //     }
    //     try {
    //         final RequestResponseFactory _requestResponseFactory = sling.getService(RequestResponseFactory.class);
    //         final SlingRequestProcessor _requestProcessor = sling.getService(SlingRequestProcessor.class);

    //         if (_requestResponseFactory != null && _requestProcessor != null) {
    //             String requestUrl = path;
    //             if (appendHTMLExtention) {
    //                 requestUrl = path.concat(".html");
    //             }

    //             final HttpServletRequest _req = _requestResponseFactory.createRequest("GET", requestUrl);

    //             WCMMode currMode = WCMMode.fromRequest(_req);

    //             if (mode != null) {
    //                 mode.toRequest(_req);
    //             } else {
    //                 WCMMode.DISABLED.toRequest(_req);
    //             }

    //             if (requestAttributes != null && isNotEmpty(requestAttributeName)) {
    //                 _req.setAttribute(requestAttributeName, requestAttributes);
    //             }

    //             final ByteArrayOutputStream _out = new ByteArrayOutputStream();
    //             final HttpServletResponse _resp = _requestResponseFactory.createResponse(_out);

    //             _requestProcessor.processRequest(_req, _resp, resourceResolver);

    //             currMode.toRequest(_req);

    //             return _out.toString();
    //         } else {
    //             LOGGER.error("resourceRenderAsHtml: could not get objects, _requestResponseFactory={},_requestProcessor={}",_requestResponseFactory,_requestProcessor);
    //         }
    //         return "<![CDATA[could not get objects]]>";
    //     } catch (Exception e) {
    //         LOGGER.error("Exception occurred: {}", e);
    //         return "<![CDATA[" + e.getMessage() + "]]>";
    //     }
    // }

}
