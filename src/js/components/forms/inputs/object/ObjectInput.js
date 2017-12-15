/**
 * Created by kib357 on 10/08/15.
 */

import React from "react";
import PropTypes from "prop-types";
import EditorBase from "../../EditorBase.js";
import SimpleInput from "../SimpleInput.js";
import changesProcessor from "../../../../utils/changesProcessor";
import { propertyTypes } from "constants";
import ActionProperty from "../btn/ActionProperty";

class ObjectInput extends EditorBase {
    constructor(props) {
        super(props);
        this.state = { item: this.getItem(props) };
    }

    componentWillReceiveProps(next) {
        this.setState({ item: this.getItem(next) });
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !nextProps.noUpdate;
    }

    render() {
        let {storeDesc, storeName, baseItem, combinedBaseItem, user} = this.props,
            {item} = this.state,
            combinedItem = changesProcessor.combineItem(item, true, true);

        let templateModel = Object.assign({ $user: user }, item, item.$changedProps);
        let propsGroupsMap = this.getPropGroupsMap(storeDesc, templateModel);

        let controls = [], wrap = propsGroupsMap.size > 1;
        //console.log(propsGroupsMap);
        for (let [key, value] of propsGroupsMap) {
            let groupControls = [], propsList = [];
            for (let propDesc of value) {
                if (propDesc.hidden(user, combinedItem, combinedBaseItem) || propDesc.display === "none") {
                    continue;
                }
                let performAction = (e, extraData) => {
                    extraData = Object.assign(extraData || {}, {
                        _actionPropName: propDesc.name,
                        _index: this.props.index,
                        _id: this.props.item._id || undefined,
                    });
                    this.props.performAction(e, extraData);
                };
                let props = {
                    fieldName: propDesc.name,
                    key: propDesc.name,
                    field: propDesc,
                    propDesc: propDesc,
                    performAction: performAction,
                    storeName: storeName,
                    item: item,
                    combinedItem: combinedItem,
                    baseItem: baseItem,
                    combinedBaseItem: combinedBaseItem,
                    className: "list-item-input",
                    onChange: this.handleChange,
                    onFocus: this.handleFocus,
                    onBlur: this.handleBlur,
                    readOnly: this.props.readOnly || propDesc.readOnly || this.props.disabled,
                    index: this.props.index,
                    hideLabel: this.props.index > 0,
                    user: user,
                };
                propsList.push(props);
            }
            for (let i = 0; i < propsList.length; i++) {
                if (i === propsList.length - 1) {
                    propsList[i].className += " last";
                }
                if (propsList[i].field.type === propertyTypes.action) {
                    var input = React.createElement(ActionProperty, propsList[i]);
                } else {
                    input = React.createElement(SimpleInput, propsList[i]);
                }
                groupControls.push(input);
            }
            if (groupControls.length > 0) {
                if (key.trim()) {
                    //controls.push((<span className="group" key={key + "-group"}>{key}</span>));
                }
                if (wrap) {
                    groupControls = <div className="flex" key={key + "-controls"}>{groupControls}</div>;
                }
                controls.push(groupControls);
            }
        }
        if (wrap) {
            controls = <div className="list-item-props-wrapper">{controls}</div>;
        }
        return (
            <div className={"list-item " + this.props.className}>
                {controls}
                {this.props.disableDelete ? null :
                    <button type="button" onClick={this.props.onDelete}
                        tabIndex="-1"
                        className="btn-flat btn-icon list-item-remove">
                        <i className="material-icons text">close</i>
                    </button>
                }
            </div>
        );
    }
}

ObjectInput.propTypes = {
    onChange: PropTypes.func.isRequired,
};
ObjectInput.defaultProps = { item: {} };

export default ObjectInput;
