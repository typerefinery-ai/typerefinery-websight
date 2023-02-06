/*
 * Copyright (C) 2022 TypeRefinery.io
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

package io.typerefinery.websight.utils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.function.Predicate;

import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceUtil;
import org.apache.sling.api.resource.ValueMap;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import pl.ds.websight.pages.core.api.Page;
import pl.ds.websight.pages.core.api.PageConstants;

import org.apache.commons.lang3.StringUtils;
import org.apache.jackrabbit.vault.util.JcrConstants;

import static java.text.MessageFormat.format;

public class PageUtil {  

    private static final Logger LOGGER = LoggerFactory.getLogger(PageUtil.class);

    public static final String PRIMARY_TYPE_PAGE = "ws:Page";
    public static final String PATH_SEPARATOR = "/";
    public static final String PROPERTY_HIDEINNAV = "hideInNav";
    public static final String PROPERTY_ICON = "icon";
    public static final String PROPERTY_TITLE = "title";
    public static final String PROPERTY_DESCRIPTION = "description";
    public static final String COMPONENT_CANCEL_INHERIT_PARENT = "cancelInheritParent";

    public static ValueMap getResourceContentValueMap(@NotNull Resource resource) {
        if (resource != null && resource.getChild(JcrConstants.JCR_CONTENT) != null) {
            return resource.getChild(JcrConstants.JCR_CONTENT).getValueMap();
        }
        return null;
    }

    /**
     * get page path from resource path
     * @param resource resource
     * @return page path
     */
    public static String getResourcePagePath(@NotNull Resource resource) {
        return resource.getPath().substring(0, resource.getPath().indexOf(JcrConstants.JCR_CONTENT)-1);
    }

    /**
     * if resource type is a path get last part of the path
     * @param resource resource
     * @return resource type
     */
    public static String getResourceTypeName(@NotNull Resource resource) {
        String resourceType = resource.getResourceType();
        if (resourceType.contains(PATH_SEPARATOR)) {
        resourceType = resourceType.substring(resourceType.lastIndexOf(PATH_SEPARATOR) + 1);
        }
        return resourceType;
    }

    /**
     * find top level parent page for current page
     * @param page current page
     * @return top level parent page
     */
    public static Page findTopLevelParentPageForCurrentPage(@NotNull Page page) {
        while (page.getParent() != null) {
        page = page.getParent();
        }

        return page;
    }

    /**
     * find sibling page for current page
     * @param rootPage root page
     * @param template template path
     * @return sibling page
     */
    public static Resource findSiblingPageForCurrentPage(@NotNull Page rootPage,
        @NotNull String template) {
        List<Resource> resources = new ArrayList<>();
        Objects.requireNonNull(rootPage.getResource().getParent()).getChildren()
            .forEach(resources::add);

        return resources.stream()
            .filter(PageUtil.isResourceSelectedTemplate(template))
            .findFirst().orElse(null);
    }

    /**
     * check if page using specific template
     * @param template template path
     * @return predicate for filtering
     */
    public static boolean isResourceSelectedTemplate(Resource resource, String template) {
        if (!ResourceUtil.isNonExistingResource(resource)
            && resource.getChild(JcrConstants.JCR_CONTENT) == null) {
            String templateString = resource.getChild(JcrConstants.JCR_CONTENT).getValueMap().get(PageConstants.PN_WS_TEMPLATE, "");
            if (StringUtils.isNotBlank(templateString)) {
                return templateString.equals(template);
            }
        }  
        return false; 
    }

    /**
     * check if page using specific template
     * @param template template path
     * @return predicate for filtering
     */
    private static Predicate<Resource> isResourceSelectedTemplate(String template) {
        return resource -> {
        if (resource.getChild(JcrConstants.JCR_CONTENT) == null) {
            return false;
        }
        Object o = resource.getChild(JcrConstants.JCR_CONTENT).getValueMap().get(PageConstants.PN_WS_TEMPLATE);
        return o != null && o.equals(template);
        };
    }


        /***
         * find an ancestor resource matching current resource.
         * @param resource resource to use path for look up
         * @return found resource
         */
        @SuppressWarnings("squid:S3776")
        public static Resource findInheritedResource(Resource thisResource) {
            final String pageResourcePath = getResourcePagePath(thisResource); // assume that page have resource
            final String nodeResourceType = thisResource.getResourceType();
            final String relativePath = thisResource.getPath().replaceFirst(pageResourcePath.concat(PATH_SEPARATOR), StringUtils.EMPTY);

            // defn of a parent node
            // 1. is from parent page
            // 2. same sling resource type
            // 3. same relative path

            Resource curPage = thisResource.getResourceResolver().getResource(pageResourcePath);
            Resource curResource = null;
            Boolean curResourceTypeMatch = false;
            Boolean curCancelInheritParent = false;
            ValueMap curProperties = null;

            try {
                while (null != curPage) {
                    // find by same relative path

                    String error = format(
                            "findInheritedResource: looking for inherited resource for path=\"{0}\" by relative path=\"{1}\" in parent=\"{2}\""
                            , pageResourcePath, relativePath, curPage.getPath());
                    LOGGER.info(error);

                    try {
                        curResource = curPage.getChild(relativePath);
                    } catch (Exception e) {
                        LOGGER.info("Failed to get {} from {}", relativePath, curPage.getPath());
                    }

                    if (null != curResource) {
                        //check for inherit flag + sling resource type

                        curProperties = curResource.adaptTo(ValueMap.class);
                        if (curProperties != null) {
                            curResourceTypeMatch = curResource.isResourceType(nodeResourceType);
                            curCancelInheritParent = curProperties.get(COMPONENT_CANCEL_INHERIT_PARENT, StringUtils.EMPTY).contentEquals("true");

                            if (curResourceTypeMatch && curCancelInheritParent) {
                                String found = format("findInheritedResource: FOUND looking for inherited resource for path=\"{0}\" by relative path=\"{1}\" in parent=\"{2}\"", pageResourcePath, relativePath, curPage.getPath());
                                LOGGER.info(found);

                                break;
                            } else {
                                String notfound = format("findInheritedResource: NOT FOUND looking for inherited resource for path=\"{0}\" by relative path=\"{1}\" in parent=\"{2}\"", pageResourcePath, relativePath, curPage.getPath());
                                LOGGER.info(notfound);

                            }
                        } else {
                            LOGGER.error("findInheritedResource: could not convert resource to value map, curResource={}", curResource);
                        }
                    }

                    curPage = curPage.getParent();
                }
            } catch (Exception ex) {
                LOGGER.warn("Failed to find inherited resource. {}", ex);
            }

            return curResource;
        }

    /**
     * update resource properties
     * @param resourceToUpdate
     * @param response
     */
    public static void updatResourceProperties(Resource resourceToUpdate, HashMap<String, Object> response) {
        try {

            LOGGER.info("updateFlowStreamResponse: {}", response);
            ResourceResolver resourceResolver = resourceToUpdate.getResourceResolver();
            ModifiableValueMap properties = resourceToUpdate.adaptTo(ModifiableValueMap.class);
            properties.putAll(response);
            resourceResolver.commit();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    private PageUtil() {
        // no instance
    }
}
