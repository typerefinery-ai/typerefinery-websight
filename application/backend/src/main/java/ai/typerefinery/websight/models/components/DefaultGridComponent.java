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

package ai.typerefinery.websight.models.components;

import static org.apache.sling.models.annotations.DefaultInjectionStrategy.OPTIONAL;

import javax.inject.Inject;
import lombok.Getter;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;

import ai.typerefinery.websight.utils.Grid;

@Getter
@Model(adaptables = Resource.class, defaultInjectionStrategy = OPTIONAL)
public class DefaultGridComponent implements Grid {

  @Inject
  @Default(intValues = 12)
  private Integer smColSize;

  @Inject
  @Default(intValues = 12)
  private Integer mdColSize;

  @Inject
  @Default(intValues = 12)
  private Integer lgColSize;

  @Inject
  private Integer smRowSize;

  @Inject
  private Integer mdRowSize;

  @Inject
  private Integer lgRowSize;

  @Inject
  private Integer smOffset;

  @Inject
  private Integer mdOffset;

  @Inject
  private Integer lgOffset;


  @Inject
  private String textAlignment;

}
