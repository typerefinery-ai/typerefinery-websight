/*
 * Copyright (C) 2023 Typerefinery.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package ai.typerefinery.websight.servlets;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import javax.servlet.Servlet;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Writes a single property onto an authored component node.
 *
 * <p><b>Why this exists.</b> There is no scriptable way to author a component property on this
 * instance: the default {@code SlingPostServlet} answers <b>405</b> for {@code /content} paths, the
 * WebSight pages-editor service exposes read actions only ({@code list-components},
 * {@code get-page-data}), and the {@code tests/content} package has diverged from the running
 * repository badly enough that deploying it would repoint a live flow. That left the authoring
 * dialog as the only way to change one field, which cannot be tested or repeated.
 * See alpha-launch {@code docs/issues/0042}.
 *
 * <p><b>Scope is deliberately narrow.</b> This is not a general repository writer:
 * <ul>
 *   <li>only paths under {@link #ALLOWED_ROOT} may be written;</li>
 *   <li>system namespaces ({@code jcr:}, {@code sling:}, {@code rep:}, {@code oak:}) are refused,
 *       so a caller cannot change a resource type, primary type or ACL through it;</li>
 *   <li>values are written as plain strings only;</li>
 *   <li>it writes through the <b>caller's</b> {@link ResourceResolver}, so repository permissions
 *       still apply — it grants no authority the caller does not already have.</li>
 * </ul>
 *
 * <p><b>Usage</b>
 * <pre>
 * curl -u &lt;user&gt;:&lt;pass&gt; -X POST \
 *   -d "path=/content/.../container2/table" \
 *   -d "name=coldStartDataSource" \
 *   -d "value=https://flow.typerefinery.localhost:8101/viz-data/table-all-incidents-shaped" \
 *   http://localhost:8113/bin/typerefinery/component-property
 * </pre>
 *
 * Responds with a small JSON body; {@code 200} on success, {@code 400} on a rejected request and
 * {@code 404} when the resource does not exist.
 */
@Component(
    service = Servlet.class,
    property = {
        "sling.servlet.paths=/bin/typerefinery/component-property",
        "sling.servlet.methods=POST"
    })
public class ComponentPropertyServlet extends SlingAllMethodsServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOG = LoggerFactory.getLogger(ComponentPropertyServlet.class);

    /** Authored content only. Nothing outside this subtree may be written. */
    private static final String ALLOWED_ROOT = "/content/";

    /** Namespaces that define structure, type or access — never writable here. */
    private static final List<String> FORBIDDEN_PREFIXES =
            Arrays.asList("jcr:", "sling:", "rep:", "oak:");

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws IOException {

        final String path = request.getParameter("path");
        final String name = request.getParameter("name");
        final String value = request.getParameter("value");

        if (isBlank(path) || isBlank(name) || value == null) {
            reject(response, 400, "path, name and value are all required");
            return;
        }
        if (!path.startsWith(ALLOWED_ROOT)) {
            LOG.warn("component-property: refused path outside {} -> {}", ALLOWED_ROOT, path);
            reject(response, 400, "path must be under " + ALLOWED_ROOT);
            return;
        }
        for (String prefix : FORBIDDEN_PREFIXES) {
            if (name.startsWith(prefix)) {
                LOG.warn("component-property: refused system property '{}' on {}", name, path);
                reject(response, 400, "property '" + name + "' is in a reserved namespace");
                return;
            }
        }

        final ResourceResolver resolver = request.getResourceResolver();
        final Resource resource = resolver.getResource(path);
        if (resource == null) {
            LOG.warn("component-property: no resource at {} (or not visible to {})",
                    path, resolver.getUserID());
            reject(response, 404, "no resource at " + path);
            return;
        }

        final ModifiableValueMap properties = resource.adaptTo(ModifiableValueMap.class);
        if (properties == null) {
            LOG.warn("component-property: {} is not modifiable by {}", path, resolver.getUserID());
            reject(response, 400, "resource is not modifiable");
            return;
        }

        final Object previous = properties.get(name);
        properties.put(name, value);
        resolver.commit();

        LOG.info("component-property: {} on {} set to '{}' by {} (was {})",
                name, path, value, resolver.getUserID(),
                previous == null ? "absent" : "'" + previous + "'");

        response.setStatus(200);
        response.setContentType("application/json");
        response.getWriter().write(String.format(
                "{\"success\":true,\"path\":%s,\"name\":%s,\"value\":%s,\"previous\":%s}",
                quote(path), quote(name), quote(value),
                previous == null ? "null" : quote(String.valueOf(previous))));
    }

    private static void reject(SlingHttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"success\":false,\"error\":" + quote(message) + "}");
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    /** Minimal JSON string escaping — these values are paths, property names and URLs. */
    private static String quote(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"")
                       .replace("\n", "\\n").replace("\r", "\\r") + "\"";
    }
}
