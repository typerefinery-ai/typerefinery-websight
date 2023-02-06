function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
import styled from "/apps/websight-atlaskit-esm/web-resources/styled-components.js";
import Button from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/button.js";
const OpenButtonContainer = styled.div`
    display: flex;
    justify-content: left;
    align-items: center;
`;
export default class Url extends React.Component {

  render() {
    const {
      value,
      title
    } = this.props;
    // eslint-disable-next-line react/jsx-props-no-spreading
    return /*#__PURE__*/React.createElement(OpenButtonContainer, null, /*#__PURE__*/React.createElement(Button, {
        appearance: "link",
        target: "_blank",
        testId: "Button_Url_Open",
        href: value
      }, title));
  }

}