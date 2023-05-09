function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import InlineMessage from "/apps/websight-atlaskit-esm/web-resources/@atlaskit/inline-message.js";
import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
import DynamicFieldsDialog from "/apps/websight-dialogs-view/web-resources/views/DynamicFieldsDialog.js";
export default class Label extends React.Component {
  render() {
    const {
      appearance,
      iconLabel,
      title,
      secondaryText,
      message,
      placement
    } = this.props;
    // eslint-disable-next-line react/jsx-props-no-spreading
    return /*#__PURE__*/React.createElement(InlineMessage, {
      placement: placement,
      type: appearance,
      appearance: appearance,
      title: title,
      secondaryText: secondaryText,
      iconLabel: iconLabel
    }, message);
  }
}
