import React from "/apps/websight-atlaskit-esm/web-resources/react.js";
import { getView, setView } from "/apps/websight/web-resources/js/viewControl.js";
import PublishTreeModal from "/apps/typerefinery/components/actions/assets/publishtree.modal.js";

class PublishTreeAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.execute = this.execute.bind(this);
  }

  execute(data) {
    this.setState({
      resources: data.resources,
      resourcesParent: data.resourcesParent
    });
    this.modalRef.open(data.resources, data.resourcesParent);
  }


  render() {
    const {
      resourcePaths,
      executeCallback
    } = this.props;
    return /*#__PURE__*/React.createElement(PublishTreeModal, {
      resourcePaths: resourcePaths,
      onSuccess: () => executeCallback(),
      ref: element => {
        this.modalRef = element;
      },
      testId: "Modal_CreatePage"
    });
  }

}

const publishtree = {
  data: {
    name: "Publish Tree",
    icon: "park",
    properties: {
      appearance: "primary"
    }
  },
  actionComponent: PublishTreeAction
};
export default publishtree;