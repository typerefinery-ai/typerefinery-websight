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
import java.util.List;
import java.util.Objects;
import java.util.function.Predicate;
import org.apache.sling.api.resource.Resource;
import org.jetbrains.annotations.NotNull;
import pl.ds.websight.pages.core.api.Page;
import pl.ds.websight.pages.core.api.PageConstants;
import org.apache.jackrabbit.vault.util.JcrConstants;

public class PageUtil {  

  public static String PATH_SEPARATOR = "/";
  public static String PROPERY_HIDEINNAV = "hideInNav";

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
  private static Predicate<Resource> isResourceSelectedTemplate(String template) {
    return resource -> {
      if (resource.getChild(JcrConstants.JCR_CONTENT) == null) {
        return false;
      }
      Object o = resource.getChild(JcrConstants.JCR_CONTENT).getValueMap().get(PageConstants.PN_WS_TEMPLATE);
      return o != null && o.equals(template);
    };
  }



  private PageUtil() {
    // no instance
  }
}
