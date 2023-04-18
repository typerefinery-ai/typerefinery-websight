window.Typerefinery = window.Typerefinery || {};
window.Typerefinery.Components = Typerefinery.Components || {};
window.Typerefinery.VueData = Typerefinery.VueData || {};

; (function (ns, vueDataNs, document, window) {
    "use strict";
    ns.registerComponent = (componentData) => {
        vueDataNs.data = {
            ...vueDataNs.data,
            ...componentData
        }
    };
    ns.getComponentConfig = ($component) => {
      return $($component).data('model') || {};
    };
    ns.replaceRegex = (str, obj) => {
        return str.replace(/{{(\w+)}}/gm, function(match, key) {
            return obj[key];
        });
    };
    ns.queryToObject = (query) => {
        const result = {};
        query.split("&").forEach((param) => {
            const [key, value] = param.split("=");
            result[key] = value;
        });
        return result;
    };
    ns.objectToQuery = (obj) => {
        return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
    };
    ns.getQueryParams = () => {
        const query = window.location.search.substring(1);
        return ns.queryToObject(query);
    };
    ns.fireballSvg = `
        <?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <svg
            xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
            xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:sodipodi="http://inkscape.sourceforge.net/DTD/sodipodi-0.dtd"
            xmlns:ns1="http://sozi.baierouge.fr"
            xmlns:cc="http://web.resource.org/cc/"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            xmlns:dc="http://purl.org/dc/elements/1.1/"
            id="flowEnabledFireBallSvg"
            inkscape:version="0.43"
            inkscape:export-filename="/home/egore/fireball.png"
            viewBox="0 0 40 40"
            sodipodi:version="0.32"
            inkscape:export-xdpi="90.000000"
            inkscape:export-ydpi="90.000000"
            sodipodi:docname="fireball.svg"
            sodipodi:docbase="/home/egore/bilder/SVG/Spiele/forbiddenmagic"
        >
        <defs
            id="defs3"
            >
            <linearGradient
                id="linearGradient2867"
            >
            <stop
                id="stop2869"
                style="stop-color:#fcbd17"
                offset="0"
            />
            <stop
                id="stop2871"
                style="stop-color:#fcee10"
                offset="1"
            />
            </linearGradient
            >
            <linearGradient
                id="linearGradient2849"
            >
            <stop
                id="stop2851"
                style="stop-color:#d3480f"
                offset="0"
            />
            <stop
                id="stop2853"
                style="stop-color:#deac06"
                offset="1"
            />
            </linearGradient
            >
            <linearGradient
                id="linearGradient2067"
            >
            <stop
                id="stop2069"
                style="stop-color:#fca829"
                offset="0"
            />
            <stop
                id="stop2071"
                style="stop-color:#fcdb29"
                offset="1"
            />
            </linearGradient
            >
            <radialGradient
                id="radialGradient2063"
                cx="11.007"
                gradientUnits="userSpaceOnUse"
                cy="33.586"
                r="14.099"
                inkscape:collect="always"
            >
            <stop
                id="stop2057"
                style="stop-color:#ff4a00"
                offset="0"
            />
            <stop
                id="stop2059"
                style="stop-color:#511700"
                offset="1"
            />
            </radialGradient
            >
            <linearGradient
                id="linearGradient2073"
                y2="11.345"
                xlink:href="#linearGradient2067"
                gradientUnits="userSpaceOnUse"
                y1="17.287"
                gradientTransform="matrix(.84173 0 0 1.188 -1.3021 -.57871)"
                x2="25.912"
                x1="17.573"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2077"
                y2="15.597"
                xlink:href="#linearGradient2067"
                gradientUnits="userSpaceOnUse"
                y1="25.06"
                gradientTransform="scale(.84173 1.188)"
                x2="34.274"
                x1="24.653"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2081"
                y2="23.54"
                xlink:href="#linearGradient2067"
                gradientUnits="userSpaceOnUse"
                y1="28.205"
                gradientTransform="matrix(.84173 0 0 1.188 -.14468 -.36169)"
                x2="23.823"
                x1="19.813"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2843"
                y2="14.015"
                xlink:href="#linearGradient2067"
                gradientUnits="userSpaceOnUse"
                y1="20.862"
                gradientTransform="matrix(.84173 0 0 1.188 -1.7361 .72338)"
                x2="25.598"
                x1="14.316"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2847"
                y2="11.345"
                xlink:href="#linearGradient2849"
                gradientUnits="userSpaceOnUse"
                y1="17.287"
                gradientTransform="matrix(.84173 0 0 1.188 -3.9721 7.3062)"
                x2="25.912"
                x1="17.573"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2857"
                y2="21.658"
                xlink:href="#linearGradient2849"
                gradientUnits="userSpaceOnUse"
                y1="29.126"
                gradientTransform="matrix(.84173 0 0 1.188 .28935 .28935)"
                x2="21.841"
                x1="17.441"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2861"
                y2="21.658"
                xlink:href="#linearGradient2849"
                gradientUnits="userSpaceOnUse"
                y1="29.126"
                gradientTransform="matrix(.84173 0 0 1.188 6.6649 2.5466)"
                x2="21.841"
                x1="17.441"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2865"
                y2="11.345"
                xlink:href="#linearGradient2867"
                gradientUnits="userSpaceOnUse"
                y1="17.287"
                gradientTransform="matrix(.84173 0 0 1.188 8.8318 -9.5487)"
                x2="25.912"
                x1="17.573"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2875"
                y2="11.345"
                xlink:href="#linearGradient2867"
                gradientUnits="userSpaceOnUse"
                y1="17.287"
                gradientTransform="matrix(.84173 0 0 1.188 13.582 -6.9235)"
                x2="25.912"
                x1="17.573"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2879"
                y2="11.345"
                xlink:href="#linearGradient2867"
                gradientUnits="userSpaceOnUse"
                y1="17.287"
                gradientTransform="matrix(.84173 0 0 1.188 23.458 -12.069)"
                x2="25.912"
                x1="17.573"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2883"
                y2="11.345"
                xlink:href="#linearGradient2867"
                gradientUnits="userSpaceOnUse"
                y1="17.287"
                gradientTransform="matrix(.84173 0 0 1.188 21.107 -16.084)"
                x2="25.912"
                x1="17.573"
                inkscape:collect="always"
            />
            <linearGradient
                id="linearGradient2887"
                y2="11.345"
                xlink:href="#linearGradient2867"
                gradientUnits="userSpaceOnUse"
                y1="17.287"
                gradientTransform="matrix(.84173 0 0 1.188 12.824 -16.265)"
                x2="25.912"
                x1="17.573"
                inkscape:collect="always"
            />
        </defs
        >
        <sodipodi:namedview
            id="base"
            bordercolor="#666666"
            inkscape:window-x="0"
            inkscape:window-y="25"
            pagecolor="#ffffff"
            inkscape:zoom="19.45"
            inkscape:pageshadow="2"
            borderopacity="1.0"
            inkscape:current-layer="layer1"
            inkscape:cx="20"
            inkscape:cy="20"
            inkscape:window-width="1270"
            inkscape:pageopacity="0.0"
            inkscape:window-height="947"
            inkscape:document-units="px"
        />
        <g
            id="layer1"
            inkscape:label="Layer 1"
            inkscape:groupmode="layer"
            >
            <path
                id="path1291"
                sodipodi:nodetypes="csssssccccc"
                style="fill-rule:evenodd;fill:#e38948"
                d="m26.24 1.2338c-5.248 1.6617-6.477 5.861-7.736 9.4032-2.33 6.553-10.574 2.62-13.418 14.341-1.1798 4.861 2.657 13.622 10.279 14.588 7.46 0.945 12.403-3.005 14.218-7.509 1.637-4.063 1.696-4.952 1.108-10.71-0.477-4.68-2.79-5.171 6.709-12.803-5.539 4.329-9.786 1.764-12.002 7.509 0.348-4.473 5.929-8.3297 4.185-15.634-1.785 8.8225-5.416 8.2276-7.14 12.434 1.676-5.759-0.045-7.308 3.797-11.619z"
            />
            <path
                id="path1293"
                sodipodi:rx="9.6163683"
                sodipodi:ry="9.6163683"
                style="fill:url(#radialGradient2063)"
                sodipodi:type="arc"
                d="m23.223 27.315a9.6164 9.6164 0 1 1 -19.233 0 9.6164 9.6164 0 1 1 19.233 0z"
                transform="matrix(1.2033 0 0 1.2033 1.4543 -5.859)"
                sodipodi:cy="27.314577"
                sodipodi:cx="13.606138"
            />
            <path
                id="path2065"
                sodipodi:nodetypes="ccc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2073)"
                d="m9.7657 24.664c-1.4468-8.391 9.2593-5.063 10.416-15.191 1.23 8.247-7.233 8.753-10.416 15.191z"
            />
            <path
                id="path2075"
                sodipodi:nodetypes="ccc"
                style="opacity:.8;fill-rule:evenodd;fill:url(#linearGradient2077)"
                d="m18.019 34.864c9.042-4.196 5.063-13.238 8.897-19.314-2.314 7.089 2.894 16.782-8.897 19.314z"
            />
            <path
                id="path2079"
                sodipodi:nodetypes="ccc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2081)"
                d="m11.285 34.719c4.412 0.507 8.319-3.978 12.153-10.055-2.315 7.089-8.247 13.528-12.153 10.055z"
            />
            <path
                id="path2841"
                sodipodi:nodetypes="ccc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2843)"
                d="m9.6933 32.245c-3.3275-4.919 10.128-7.161 13.311-15.118-1.158 8.029-13.817 12.442-13.311 15.118z"
            />
            <path
                id="path2845"
                sodipodi:nodetypes="ccc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2847)"
                d="m8.0361 32.187c-3.1829-7.957 5.0639-8.246 12.008-14.684-1.736 9.114-11.936 9.91-12.008 14.684z"
            />
            <path
                id="path2855"
                sodipodi:nodetypes="ccc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2857)"
                d="m9.4666 33.381c1.5194-1.664 10.561-5.642 16.637-17.795-6.076 19.314-12.659 22.497-16.637 17.795z"
            />
            <path
                id="path2859"
                sodipodi:nodetypes="cscsc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2861)"
                d="m16.638 36.289c5.172-2.098 7.686-2.351 8.906-5.968 1.221-3.617 0.715-10.597 3.464-14.142-1.881 4.919 0.054 12.786-1.917 16.665-1.972 3.879-6.619 5.724-10.453 3.445z"
            />
            <path
                id="path2863"
                sodipodi:nodetypes="cscsc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2865)"
                d="m14.547 21.409c1.229-2.387 6.022-6.492 7.83-8.825 1.809-2.333 1.212-6.0766 4.829-11.213-0.905 4.9917-2.189 9.676-3.644 12.461-1.456 2.785-6.773 4.684-9.015 7.577z"
            />
            <path
                id="path2873"
                sodipodi:nodetypes="cscsc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2875)"
                d="m15.205 27.973c7.879-7.042 9.245-11.915 10.388-15.015 1.022-2.769 5.713-3.5186 9.33-8.6546-0.904 4.9913-7.308 7.0516-8.043 10.108-0.842 3.501-7.745 11.129-11.675 13.562z"
            />
            <path
                id="path2877"
                sodipodi:nodetypes="ccc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2879)"
                d="m29.782 11.976c3.033-2.7736 6.191-2.5463 9.808-7.6823-0.904 4.9913-5.443 6.5513-9.808 7.6823z"
            />
            <path
                id="path2881"
                sodipodi:nodetypes="ccc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2883)"
                d="m27.07 9.336c1.296-3.3527 1.561-5.5849 5.25-8.4784-2.93 3.0382-1.248 6.7686-5.25 8.4784z"
            />
            <path
                id="path2885"
                sodipodi:nodetypes="ccc"
                style="opacity:0.8;fill-rule:evenodd;fill:url(#linearGradient2887)"
                d="m19.872 14.725c2.309-3.859-1.332-9.8526 3.153-13.325-1.483 4.3404 1.501 10.096-3.153 13.325z"
            />
        </g
        >
        <metadata
            >
            <rdf:RDF
            >
            <cc:Work
                >
                <dc:format
                >image/svg+xml</dc:format
                >
                <dc:type
                    rdf:resource="http://purl.org/dc/dcmitype/StillImage"
                />
                <cc:license
                    rdf:resource="http://creativecommons.org/licenses/publicdomain/"
                />
                <dc:publisher
                >
                <cc:Agent
                    rdf:about="http://openclipart.org/"
                    >
                    <dc:title
                    >Openclipart</dc:title
                    >
                </cc:Agent
                >
                </dc:publisher
                >
            </cc:Work
            >
            <cc:License
                rdf:about="http://creativecommons.org/licenses/publicdomain/"
                >
                <cc:permits
                    rdf:resource="http://creativecommons.org/ns#Reproduction"
                />
                <cc:permits
                    rdf:resource="http://creativecommons.org/ns#Distribution"
                />
                <cc:permits
                    rdf:resource="http://creativecommons.org/ns#DerivativeWorks"
                />
            </cc:License
            >
            </rdf:RDF
            >
        </metadata
        >
        </svg>
    `;
    ns.init = () => {
        setTimeout(() => {
            $("[component]").each(function () { 
                const componentConfig = ns.getComponentConfig(this);
                if (componentConfig.flowapi_enable && componentConfig.flowapi_enable == true && componentConfig.flowapi_editurl) {
                    const $component = this;
                    const $flowEnabledFireBallDiv = $('<div class="flow-enabled-fire-ball-container"></div>');
                    $flowEnabledFireBallDiv.append(`
                        <a 
                            class="flow-enabled-fire-ball-button" 
                            href="${componentConfig.flowapi_editurl}" 
                            target="_blank" 
                            id="flowEnabledFireBallButton"
                        >
                            ${ns.fireballSvg}
                        </a>
                    `);
                  
                    $component.append($flowEnabledFireBallDiv[0]);
                }
            });
        }, 1000);
    };
    ns.init();
})(window.Typerefinery.Components, window.Typerefinery.VueData, document, window);