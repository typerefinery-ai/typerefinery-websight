# Copyright (C) 2023 Typerefinery.io
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM docker.io/openjdk:17-slim

EXPOSE 8080

RUN mkdir /websight && \
    mkdir /websight/cache && \
    mkdir /websight/docroot && \
    mkdir /var/websight

VOLUME /websight/repository
VOLUME /websight/docroot

COPY src/main/docker/typerefinery-websight/bin /websight/bin
RUN ["chmod", "+x", "/websight/bin/launch.sh"]
COPY target/dependency/org.apache.sling.feature.launcher /websight/org.apache.sling.feature.launcher
COPY target/artifacts/ /websight/cache/

RUN chmod +x /websight/org.apache.sling.feature.launcher/bin/launcher

RUN apt-get update && apt-get install curl --assume-yes
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s CMD curl --fail http://localhost:8080/system/health || exit 1

WORKDIR /websight
ENTRYPOINT [ "/websight/bin/launch.sh" ]
CMD ["typerefinery-websight"]
