/*
 * Copyright (C) 2022 Typerefinery.io
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
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;

import io.typerefinery.websight.models.components.layout.Styled;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class DefaultStyledComponent implements Styled {

  @Inject
  private String classes;

  private String[] componentClasses;

  public String[] getClasses() {
    return componentClasses;
  }

  @PostConstruct
  private void init() {
    List<String> componentClasses = new LinkedList<>();

    if (StringUtils.isNotEmpty(classes)) {
      componentClasses.addAll(Arrays.asList(classes.split(" ")));
    }
    this.componentClasses = componentClasses.toArray(new String[]{});
  }

}
