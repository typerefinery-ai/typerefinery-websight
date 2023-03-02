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
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.stream.Collectors;
import javax.annotation.PostConstruct;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;

import io.typerefinery.websight.utils.Grid;
import io.typerefinery.websight.utils.Styled;

@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class DefaultStyledGridComponent implements Styled, Grid {

  @Self
  private DefaultStyledComponent style;


  public Map<String, String> gridConfig = new HashMap<String, String>() {
    {
      put("lgColSize", "col-lg-");
      put("mdColSize", "col-md-");
      put("smColSize", "col-sm-");
    }
  };

  public Map<String, String> textAlignmentConfig = new HashMap<String, String>() {
    {
      put("left", "text-start");
      put("center", "text-center");
      put("right", "text-end");
    }
  };

  @Self
  private DefaultGridComponent grid;

  private String[] componentClasses;

  @Override
  public String[] getClasses() {
    return componentClasses;
  }

  public void addClasses(String className) {
    if (componentClasses == null) {
      componentClasses = new String[] {};
    }

    componentClasses = ArrayUtils.add(componentClasses, className);

  }

  @Override
  public Integer getSmColSize() {
    return grid.getSmColSize();
  }

  @Override
  public Integer getMdColSize() {
    return grid.getMdColSize();
  }

  @Override
  public Integer getLgColSize() {
    return grid.getLgColSize();
  }

  @Override
  public Integer getSmRowSize() {
    return grid.getSmRowSize();
  }

  @Override
  public Integer getMdRowSize() {
    return grid.getMdRowSize();
  }

  @Override
  public Integer getLgRowSize() {
    return grid.getLgRowSize();
  }

  @Override
  public Integer getSmOffset() {
    return grid.getSmOffset();
  }

  @Override
  public Integer getMdOffset() {
    return grid.getMdOffset();
  }

  @Override
  public Integer getLgOffset() {
    return grid.getLgOffset();
  }

  @Override
  public String getTextAlignment() {
    return grid.getTextAlignment();
  }

  public String getAllGridClasses() {
    String result = "";
    result += gridConfig.get("lgColSize") + getLgColSize();
    result += " " + gridConfig.get("mdColSize") + getMdColSize();
    result += " " + gridConfig.get("smColSize") + getSmColSize();
    result += " " + textAlignmentConfig.getOrDefault(getTextAlignment(), "");
    return result;
  }

  @PostConstruct
  private void init() {
    if (style != null) {
        componentClasses = Arrays.stream(style.getClasses())
            .collect(Collectors.toCollection(LinkedHashSet::new))
            .toArray(new String[] {});
    }
  }
}
