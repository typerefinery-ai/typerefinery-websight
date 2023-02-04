function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
import styled from "/apps/websight-atlaskit-esm/web-resources/styled-components.js";
import TextField from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/textfield.js";
import Button from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/button.js";
import Icon from "/apps/websight-ui-components/icon/web-resources/index.js";
const ComponentContainer = styled.div`
    display: flex;
    width: 100%;
    position: relative;
`;
const OpenButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;
const IconStyle = {
  color: '#a5adba'
};
export default class Url extends React.Component {

  openUrl() {
    const {
      href
    } = this.props;
    if (href) {
      window.open(href, '_blank');
    }
  }

  render() {
    const {
      value,
      testId
    } = this.props;
    // eslint-disable-next-line react/jsx-props-no-spreading
    return /*#__PURE__*/React.createElement(ComponentContainer, {
        "data-testid": testId
      },
      /*#__PURE__*/React.createElement(TextField, 
        _extends({
          autocomplete: "off",
        }, this.props)
      ),
      /*#__PURE__*/React.createElement(OpenButtonContainer, null, /*#__PURE__*/React.createElement(Button, {
        appearance: "subtle",
        onClick: this.openUrl,
        iconBefore: /*#__PURE__*/React.createElement(Icon, {
          style: IconStyle,
          name: "shortcut"
        }),
        testId: "Button_Url_Open",
        href: value
      }, "Open"))
    );
  }

}