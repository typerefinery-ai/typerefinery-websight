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

package io.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;

import io.typerefinery.websight.utils.Styled;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class DefaultStyledComponent implements Styled {

  @Inject
  private String classes;

  @SlingObject
  private Resource resource;

  // private String componentName;

  private String[] componentClasses;

  public String[] getClasses() {
    return componentClasses;
  }

  public void addClasses(String className) {
    if (StringUtils.isEmpty(className)) {
        return;
    }
    if (componentClasses == null) {
        componentClasses = new String[]{};
    }

    componentClasses = ArrayUtils.add(componentClasses, className);
    
  }

  @PostConstruct
  private void init() {
    List<String> componentClasses = new LinkedList<>();


    // add default class name as first class
    // String resourceSuperType = resource.getResourceType();
    // componentName = resourceSuperType.substring(resourceSuperType.lastIndexOf('/') + 1);
    // componentClasses.add(componentName);


    if (StringUtils.isNotEmpty(classes)) {
      componentClasses.addAll(Arrays.asList(classes.split(" ")));
    }
    this.componentClasses = componentClasses.toArray(new String[]{});
  }

}
