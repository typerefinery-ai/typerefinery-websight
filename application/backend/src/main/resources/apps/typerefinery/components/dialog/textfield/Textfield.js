function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import TextField from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/textfield.js";
import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
export default class Textfield extends React.Component {
  render() {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return /*#__PURE__*/React.createElement(TextField, _extends({
      autocomplete: "off"
    }, this.props));
  }

}