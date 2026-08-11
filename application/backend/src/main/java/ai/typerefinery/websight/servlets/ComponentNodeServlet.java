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
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.servlet.Servlet;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.PersistenceException;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Creates or updates an authored component <b>subtree</b> from a JSON description.
 *
 * <p><b>Why this exists.</b> {@link ComponentPropertyServlet} answers the "change one field" case,
 * but it deliberately refuses {@code sling:} and {@code jcr:} names, so it cannot bring a
 * <em>component</em> into being — a component is defined by its {@code sling:resourceType}. The
 * default {@code SlingPostServlet} still answers <b>405</b> for {@code /content}, and the WebSight
 * pages-editor exposes read actions only, so authoring a new component was possible solely through
 * the editing dialog: unscriptable, unrepeatable and untestable. This closes that gap for authored
 * content while keeping the same guard rails.
 *
 * <p><b>It stays data-agnostic.</b> The servlet knows nothing about incidents, STIX or any domain:
 * it copies whatever resource types and property names the caller supplies. The vocabulary lives in
 * the caller's payload and therefore in authored content, which is where
 * {@code docs/data-agnostic-principle.md} requires it.
 *
 * <p><b>Scope is deliberately narrow.</b>
 * <ul>
 *   <li>only paths under {@link #ALLOWED_ROOT} may be written;</li>
 *   <li>of the system namespaces only {@code sling:resourceType} and {@code jcr:primaryType} are
 *       accepted — enough to define a component, while {@code rep:}/{@code oak:} and every other
 *       {@code jcr:} name (notably ACL and versioning) stay refused;</li>
 *   <li>values are written as plain strings; nested objects become child nodes;</li>
 *   <li>it writes through the <b>caller's</b> {@link ResourceResolver}, so repository permissions
 *       still apply — it grants no authority the caller does not already have.</li>
 * </ul>
 *
 * <p><b>Usage</b> — {@code parent} is an existing node, {@code name} the child to create:
 * <pre>
 * curl -u &lt;user&gt;:&lt;pass&gt; -X POST \
 *   -d 'parent=/content/.../rootcontainer/main' \
 *   -d 'name=newobject' \
 *   -d 'json={"sling:resourceType":"typerefinery/components/forms/fields/button",
 *             "label":"New Object",
 *             "dropdownItems":{"0":{"label":"Identity","action":"modal","link":"/content/..."}}}' \
 *   http://localhost:8113/bin/typerefinery/component-node
 * </pre>
 *
 * <p><b>Ordering</b> — an optional {@code before} names a sibling to sit in front of. A WebSight page
 * renders its rootcontainer children in <b>JCR child order</b>, so without this, chrome authored onto
 * a page that already has a {@code main} lands <em>after</em> the content — a stray band below the
 * fold (alpha-launch docs/issues/0139):
 * <pre>
 *   -d 'parent=/content/.../rootcontainer' -d 'name=header' -d 'before=main' -d 'json={...}'
 * </pre>
 *
 * <p><b>Deleting</b> — {@code operation=delete} with {@code parent} and {@code name}. It refuses a
 * node that still has children unless {@code recursive=true}, and reports a count rather than a bare
 * success, because an earlier authoring script POSTed {@code delete=true} to this servlet, was
 * silently ignored, and reported success while doing nothing:
 * <pre>
 *   -d 'operation=delete' -d 'parent=/content/.../rootcontainer' -d 'name=header'
 * </pre>
 *
 * <p>Responds {@code 200} on success with the created path and a node count, {@code 400} on a
 * rejected request and {@code 404} when the parent does not exist.
 */
@Component(
    service = Servlet.class,
    property = {
        "sling.servlet.paths=/bin/typerefinery/component-node",
        "sling.servlet.methods=POST"
    })
public class ComponentNodeServlet extends SlingAllMethodsServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOG = LoggerFactory.getLogger(ComponentNodeServlet.class);

    /** Authored content only. Nothing outside this subtree may be written. */
    private static final String ALLOWED_ROOT = "/content/";

    /** The only system properties a component definition legitimately needs. */
    private static final List<String> ALLOWED_SYSTEM_PROPERTIES =
            Arrays.asList("sling:resourceType", "jcr:primaryType");

    /** Namespaces that define structure, type or access and are never writable here. */
    private static final List<String> FORBIDDEN_PREFIXES =
            Arrays.asList("jcr:", "sling:", "rep:", "oak:");

    /** Guards against a runaway or malicious payload; real components are far smaller. */
    private static final int MAX_NODES = 500;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws IOException {

        final String parentPath = request.getParameter("parent");
        final String name = request.getParameter("name");
        final String json = request.getParameter("json");
        final String operation = request.getParameter("operation");
        final String before = request.getParameter("before");

        // alpha-launch docs/issues/0139: create-and-update-only meant a node authored by mistake was
        // permanent, and one authored in the wrong position stayed there — a WebSight page renders
        // its rootcontainer children in JCR child order, so retrofitted chrome landed BELOW the
        // content and could not be moved. Delete and ordering are the two missing verbs.
        if ("delete".equals(operation)) {
            doDelete(request, response, parentPath, name);
            return;
        }

        if (isBlank(parentPath) || isBlank(name) || isBlank(json)) {
            reject(response, 400, "parent, name and json are all required");
            return;
        }
        if (!parentPath.startsWith(ALLOWED_ROOT)) {
            LOG.warn("component-node: refused parent outside {} -> {}", ALLOWED_ROOT, parentPath);
            reject(response, 400, "parent must be under " + ALLOWED_ROOT);
            return;
        }
        if (name.contains("/") || name.contains("..")) {
            LOG.warn("component-node: refused node name '{}'", name);
            reject(response, 400, "name must be a single node name");
            return;
        }

        final ResourceResolver resolver = request.getResourceResolver();
        final Resource parent = resolver.getResource(parentPath);
        if (parent == null) {
            LOG.warn("component-node: no resource at {} (or not visible to {})",
                    parentPath, resolver.getUserID());
            reject(response, 404, "no resource at " + parentPath);
            return;
        }

        final JsonNode description;
        try {
            description = MAPPER.readTree(json);
        } catch (JsonProcessingException e) {
            LOG.warn("component-node: unparseable json for {}/{}: {}", parentPath, name,
                    e.getOriginalMessage());
            reject(response, 400, "json could not be parsed: " + e.getOriginalMessage());
            return;
        }
        if (!description.isObject()) {
            reject(response, 400, "json must describe an object");
            return;
        }

        final int[] created = { 0 };
        try {
            final Resource node = writeNode(resolver, parent, name, description, created);
            final String ordered = orderBefore(parent, name, before);
            resolver.commit();
            LOG.info("component-node: wrote {} ({} nodes) as {} for {}{}",
                    node.getPath(), created[0],
                    description.path("sling:resourceType").asText("(no resource type)"),
                    resolver.getUserID(),
                    ordered == null ? "" : " (" + ordered + ")");
            response.setStatus(200);
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                    "{\"success\":true,\"path\":%s,\"nodes\":%d,\"ordered\":%s}",
                    quote(node.getPath()), created[0],
                    ordered == null ? "null" : quote(ordered)));
        } catch (IllegalArgumentException e) {
            // A refused property name — report it rather than silently dropping it, so a caller
            // never believes it authored something it did not.
            LOG.warn("component-node: refused {}/{}: {}", parentPath, name, e.getMessage());
            resolver.revert();
            reject(response, 400, e.getMessage());
        } catch (PersistenceException e) {
            LOG.error("component-node: failed writing {}/{}", parentPath, name, e);
            resolver.revert();
            reject(response, 400, "could not write node: " + e.getMessage());
        }
    }

    /**
     * Create (or update) {@code name} under {@code parent} from {@code description}, recursing into
     * nested objects as child nodes.
     */
    private Resource writeNode(ResourceResolver resolver, Resource parent, String name,
            JsonNode description, int[] created)
            throws PersistenceException {

        if (++created[0] > MAX_NODES) {
            throw new IllegalArgumentException("payload describes more than " + MAX_NODES + " nodes");
        }

        final Map<String, Object> properties = new HashMap<>();
        // Linked, so numbered children (dropdownItems 0,1,2…) are written in the order given.
        final Map<String, JsonNode> children = new java.util.LinkedHashMap<>();

        final Iterator<Map.Entry<String, JsonNode>> fields = description.fields();
        while (fields.hasNext()) {
            final Map.Entry<String, JsonNode> field = fields.next();
            final String key = field.getKey();
            final JsonNode value = field.getValue();
            if (value.isObject()) {
                children.put(key, value);
                continue;
            }
            if (value.isArray()) {
                throw new IllegalArgumentException(
                        "arrays are not supported ('" + key + "'); JCR stores ordered children as "
                        + "numbered child nodes, so send {\"0\":{...},\"1\":{...}} instead");
            }
            assertWritable(key);
            properties.put(key, value.asText());
        }
        properties.putIfAbsent("jcr:primaryType", "nt:unstructured");

        Resource node = resolver.getResource(parent, name);
        if (node == null) {
            node = resolver.create(parent, name, properties);
        } else {
            // Updating in place keeps the servlet idempotent, so re-running an authoring script
            // corrects a node instead of failing or duplicating it.
            final org.apache.sling.api.resource.ModifiableValueMap existing =
                    node.adaptTo(org.apache.sling.api.resource.ModifiableValueMap.class);
            if (existing == null) {
                throw new IllegalArgumentException(node.getPath() + " is not modifiable");
            }
            for (Map.Entry<String, Object> entry : properties.entrySet()) {
                if (!"jcr:primaryType".equals(entry.getKey())) {
                    existing.put(entry.getKey(), entry.getValue());
                }
            }
        }

        for (Map.Entry<String, JsonNode> child : children.entrySet()) {
            writeNode(resolver, node, child.getKey(), child.getValue(), created);
        }
        return node;
    }

    /**
     * Move {@code name} to sit immediately before sibling {@code before} in the parent's child
     * order — the position a WebSight page actually renders in.
     *
     * <p>alpha-launch docs/issues/0139. Without this, chrome authored onto a page that already has
     * a {@code main} renders <em>after</em> the content: a stray band below the fold that could not
     * be moved. {@code before=main} puts it where the design shows it.
     *
     * <p>Returns a description of what happened, or {@code null} when no ordering was requested, so
     * the caller is told rather than left to assume. A blank {@code before} is not an error — it
     * simply means "leave the order alone".
     *
     * @throws IllegalArgumentException if the sibling does not exist or the parent cannot be
     *         ordered, because silently leaving a node in the wrong place is exactly the failure
     *         this method exists to end.
     */
    private String orderBefore(Resource parent, String name, String before) {
        if (isBlank(before)) {
            return null;
        }
        final javax.jcr.Node parentNode = parent.adaptTo(javax.jcr.Node.class);
        if (parentNode == null) {
            throw new IllegalArgumentException(
                    parent.getPath() + " cannot be ordered (not a JCR node)");
        }
        try {
            if (!parentNode.getPrimaryNodeType().hasOrderableChildNodes()) {
                throw new IllegalArgumentException(
                        parent.getPath() + " has unorderable children ("
                        + parentNode.getPrimaryNodeType().getName() + ")");
            }
            if (!parentNode.hasNode(before)) {
                throw new IllegalArgumentException(
                        "no sibling '" + before + "' under " + parent.getPath() + " to order before");
            }
            parentNode.orderBefore(name, before);
            return "ordered " + name + " before " + before;
        } catch (javax.jcr.RepositoryException e) {
            throw new IllegalArgumentException(
                    "could not order " + name + " before " + before + ": " + e.getMessage());
        }
    }

    /**
     * Remove an authored node.
     *
     * <p>alpha-launch docs/issues/0139: a node created by mistake used to be permanent. An earlier
     * authoring script even POSTed {@code delete=true} and was silently ignored, reporting success
     * while doing nothing — which is why this returns an explicit count rather than a bare 200.
     *
     * <p>Guarded the same way writes are: authored content only, single node name, and it
     * <b>refuses a node that has children</b> unless {@code recursive=true}. Deleting a subtree by
     * accident is far worse than the problem this solves.
     */
    private void doDelete(SlingHttpServletRequest request, SlingHttpServletResponse response,
            String parentPath, String name) throws IOException {

        if (isBlank(parentPath) || isBlank(name)) {
            reject(response, 400, "parent and name are required to delete");
            return;
        }
        if (!parentPath.startsWith(ALLOWED_ROOT)) {
            LOG.warn("component-node: refused delete outside {} -> {}", ALLOWED_ROOT, parentPath);
            reject(response, 400, "parent must be under " + ALLOWED_ROOT);
            return;
        }
        if (name.contains("/") || name.contains("..")) {
            reject(response, 400, "name must be a single node name");
            return;
        }

        final ResourceResolver resolver = request.getResourceResolver();
        final Resource parent = resolver.getResource(parentPath);
        if (parent == null) {
            reject(response, 404, "no resource at " + parentPath);
            return;
        }
        final Resource victim = resolver.getResource(parent, name);
        if (victim == null) {
            // Idempotent: a delete of something already gone is a success, not an error, so a
            // re-run of an authoring script does not fail on its own previous work.
            LOG.info("component-node: delete {}/{} — already absent", parentPath, name);
            response.setStatus(200);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":true,\"deleted\":0,\"note\":\"already absent\"}");
            return;
        }

        final boolean recursive = "true".equals(request.getParameter("recursive"));
        int children = 0;
        for (Iterator<Resource> it = victim.listChildren(); it.hasNext(); it.next()) {
            children++;
        }
        if (children > 0 && !recursive) {
            LOG.warn("component-node: refused delete of {} — {} child node(s), recursive not set",
                    victim.getPath(), children);
            reject(response, 400, victim.getPath() + " has " + children
                    + " child node(s); pass recursive=true to delete the subtree");
            return;
        }

        final String path = victim.getPath();
        try {
            resolver.delete(victim);
            resolver.commit();
            LOG.info("component-node: deleted {} ({} child node(s)) for {}",
                    path, children, resolver.getUserID());
            response.setStatus(200);
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                    "{\"success\":true,\"deleted\":1,\"path\":%s,\"children\":%d}",
                    quote(path), children));
        } catch (PersistenceException e) {
            LOG.error("component-node: failed deleting {}", path, e);
            resolver.revert();
            reject(response, 400, "could not delete node: " + e.getMessage());
        }
    }

    /** Refuse system namespaces other than the two a component definition needs. */
    private void assertWritable(String propertyName) {
        if (ALLOWED_SYSTEM_PROPERTIES.contains(propertyName)) {
            return;
        }
        for (String prefix : FORBIDDEN_PREFIXES) {
            if (propertyName.startsWith(prefix)) {
                throw new IllegalArgumentException(
                        "property '" + propertyName + "' is in a reserved namespace");
            }
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void reject(SlingHttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write(
                String.format("{\"success\":false,\"error\":%s}", quote(message)));
    }

    private static String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
