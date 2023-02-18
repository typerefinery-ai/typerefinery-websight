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

package io.typerefinery.websight.models.components.layout;

import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@Builder
@RequiredArgsConstructor
public class GridImpl implements Grid {

  private final Integer smColSize;

  private final Integer mdColSize;
  
  private final Integer lgColSize;
  
  private final Integer smRowSize;

  private final Integer mdRowSize;

  private final Integer lgRowSize;

  private final Integer smOffset;

  private final Integer mdOffset;

  private final Integer lgOffset;

  private final String smSpacing;

  private final String mdSpacing;

  private final String lgSpacing;
}
