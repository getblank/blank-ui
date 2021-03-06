/**
 * Created by kib357 on 10/08/15.
 */

import React from "react";
import PropTypes from "prop-types";
import { displayTypes, propertyTypes } from "constants";
import InputBase from "./InputBase.js";
import SimpleLabel from "../SimpleLabel";
import Html from "../viewers/Html";
import SearchBox from "./select/SearchBox";
import Autocomplete from "./text/Autocomplete";
import CheckList from "./select/CheckList";
import CheckBox from "./select/CheckBox";
import Radio from "./select/Radio";
import NewUsername from "./text/NewUsername";
import MaskedInput from "./text/MaskedInput";
import DatePicker from "./date/DatePicker";
import DateTimePicker from "./date/DateTimePicker";
import DateRange from "./date/DateRange";
import NumberRange from "./number/NumberRange";
import StringRange from "./text/StringRange";
import ColorPicker from "./color/ColorPicker";
import TextArea from "./text/TextArea";
import CodeEditor from "./text/CodeEditor";
import FilePicker from "./file/FilePicker";
import classnames from "classnames";
import moment from "moment";
import uuid from "uuid";

const fixedWidthTypes = [
    displayTypes.autocomplete,
    displayTypes.textInput,
    displayTypes.numberInput,
    displayTypes.newUsernameInput,
    displayTypes.masked,
    displayTypes.select,
    displayTypes.searchBox,
    displayTypes.password,
    displayTypes.datePicker,
];

class SimpleInput extends InputBase {
    constructor(props) {
        super(props);
        this.handleSimpleChange = this.handleSimpleChange.bind(this);
        this.handleValueChange = this.handleValueChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);

        this.state = this.initState();
        this.state.focused = false;

        if (props.field.display === displayTypes.searchBox) {
            this.handleRefChange = this.handleRefChange.bind(this);
            this.handleSearchBoxOptionsLoaded = this.handleSearchBoxOptionsLoaded.bind(this);
        }
    }

    initState() {
        const { field, user } = this.props;
        const state = { id: uuid.v4() };
        const templateModel = this.getTemplateModel();
        state.access = "crud";
        if (user) {
            state.access = field.groupAccess + (user._id === this.props.item._ownerId ? field.ownerAccess : "");
        }

        state.show = true;
        state.labelText = field.label(templateModel);
        state.placeholder = null;
        state.fieldOptions = null;
        if (field.placeholder) {
            state.placeholder = field.placeholder(templateModel);
        }

        if (field.options) {
            state.fieldOptions = [];
            for (let i = 0; i < field.options.length; i++) {
                const option = {
                    label: field.options[i].label(templateModel),
                    value: field.options[i].value,
                };
                state.fieldOptions.push(option);
            }

            if (field.display === displayTypes.select) {
                state.fieldOptionsControls = (state.fieldOptions || []).map((option, index) => {
                    return (
                        <option value={option.value} key={option.value + "-" + index}>
                            {option.label}
                        </option>
                    );
                });
                state.fieldOptionsControls.unshift(<option value="" key="__empty" />);
            }
        }

        state.value = this.getValue(this.props);
        state.changed = this.isChanged(this.props);

        return state;
    }

    componentWillReceiveProps(nextProps) {
        const newState = {};
        newState.value = this.getValue(nextProps);
        newState.changed = this.isChanged(nextProps);
        this.setState(newState);
    }

    handleSimpleChange(e, type) {
        const input = e.target;
        if (type === "float" && input.value.length > 0) {
            const value = input.value.toString().replace(",", ".");
            return this.handleValueChange(value);
        }
        this.handleValueChange(input.value.length > 0 ? input.value : null);
    }

    handleValueChange(value, immediately) {
        clearTimeout(this.state.timer);
        if (immediately) {
            this.props.onChange(this.props.fieldName, value);
        } else {
            const timer = setTimeout(() => {
                if (typeof this.props.onChange === "function") {
                    this.props.onChange(this.props.fieldName, value);
                }
            }, this.props.timeout || 100);

            this.setState({ timer: timer, value: value });
        }
    }

    handleRefChange(value, item) {
        const { field, fieldName } = this.props;
        this.props.onChange(fieldName, value);
        if (field.type === propertyTypes.ref && field.populateIn) {
            if (field.populateIn.map) {
                if (!field.populateIn.fn) {
                    field.populateIn.fn = new Function("$item", field.populateIn.map);
                }

                item = field.populateIn.fn(item);
            }

            setTimeout(() => this.props.onChange(field.populateIn.prop, item), 1000);
        }
    }

    handleSearchBoxOptionsLoaded(options) {
        const { field } = this.props;
        if (field.type === propertyTypes.ref && field.populateIn && Array.isArray(options) && options.length === 1) {
            let populatedItem = options[0];
            if (field.populateIn.map) {
                if (!field.populateIn.fn) {
                    field.populateIn.fn = new Function("$item", field.populateIn.map);
                }
                populatedItem = field.populateIn.fn(options[0]);
            }

            this.props.onChange(field.populateIn.prop, populatedItem, true);
        }
    }

    handleFocus(e) {
        this.setState({ focused: true }, () => {
            if (typeof this.props.onFocus === "function") {
                this.props.onFocus(this.props.fieldName);
            }
        });
    }

    handleBlur(e) {
        this.setState({ focused: false }, () => {
            if (typeof this.props.onBlur === "function") {
                this.props.onBlur(this.props.fieldName);
            }
        });
    }

    createMarkup(text) {
        return { __html: text };
    }

    render() {
        //let start = Date.now();
        const { fieldName, field, item, baseItem } = this.props;
        const dirty = (item.$dirtyProps || {}).hasOwnProperty(fieldName);
        const touched =
            (item.$touchedProps || {}).hasOwnProperty(fieldName) || item.$touched || (baseItem && baseItem.$touched);
        const invalid = (item.$invalidProps || {}).hasOwnProperty(fieldName);
        const cn = classnames("form-field", this.props.className, field.сlassName, {
            dirty,
            touched,
            invalid,
            pristine: !dirty,
            untouched: !touched,
            valid: !invalid,
            focused: this.state.focused,
            //display-specified
            "checkbox-control": field.display === displayTypes.checkbox,
            "header-control": field.display === displayTypes.headerInput,
            "fixed-width": fixedWidthTypes.indexOf(field.display) >= 0,
            // "unset": field.display === displayTypes.searchBox,
        });
        const disabled =
            field.disabled(this.props.user, this.props.combinedItem, baseItem) ||
            this.props.readOnly ||
            this.state.access.indexOf("u") < 0;

        const { id } = this.state;
        const label = !this.props.hideLabel && (
            <SimpleLabel
                id={id}
                text={this.state.labelText}
                changed={this.state.changed}
                tooltip={field.tooltip}
                storeName={this.props.storeName}
                className={field.labelClassName}
            />
        );
        const input = this.getInput(id, disabled, invalid);

        return (
            <div className={cn} data-flex={field.displayWidth || ""} style={field.style}>
                {field.display === displayTypes.checkbox || label}
                {input}
                {field.display === displayTypes.checkbox && label}
                {invalid && (
                    <span
                        className="error"
                        dangerouslySetInnerHTML={this.createMarkup(item.$invalidProps[fieldName][0].message)}
                    />
                )}
            </div>
        );
    }

    getInput(id, disabled, invalid) {
        const { field: propDesc, item, baseItem, combinedBaseItem, user } = this.props;
        const cn = "form-control";
        const { value } = this.state;
        let display = propDesc.display;
        if (display !== "react" && (propDesc.type === propertyTypes.file || propDesc.type === propertyTypes.fileList)) {
            display = displayTypes.filePicker;
        }
        switch (display) {
            case displayTypes.text: {
                let text = value === 0 ? "0" : value || "";
                if (propDesc.type === propertyTypes.date) {
                    var date = propDesc.utc ? moment.utc(text) : moment(text);
                    text = date.format(propDesc.format || "DD.MM.YYYY - HH:mm:ss, dd");
                }

                if (this.state.fieldOptions) {
                    for (let i = 0; i < this.state.fieldOptions.length; i++) {
                        if (text === this.state.fieldOptions[i].value) {
                            text = this.state.fieldOptions[i].label;
                        }
                    }
                }

                return <p>{text || <span>&#160; </span>}</p>;
            }
            case displayTypes.react:
                return React.createElement(propDesc.$component, {
                    ...this.props,
                    disabled,
                    onChange: this.handleValueChange,
                    onBlur: this.handleBlur,
                    onFocus: this.handleFocus,
                    value,
                    propDesc,
                });
            case displayTypes.autocomplete:
                return (
                    <Autocomplete
                        value={this.state.value}
                        options={this.state.fieldOptions || []}
                        load={propDesc.load}
                        placeholder={this.state.placeholder}
                        disabled={disabled}
                        propDesc={propDesc}
                        onChange={this.handleValueChange}
                    />
                );
            case displayTypes.textInput:
                return (
                    <input
                        type="text"
                        id={id}
                        disabled={disabled}
                        onChange={this.handleSimpleChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        value={value != null ? value : ""}
                        placeholder={this.state.placeholder}
                        pattern={propDesc.pattern}
                        className={cn}
                    />
                );
            case displayTypes.newUsernameInput:
                return (
                    <NewUsername
                        id={id}
                        changed={this.state.changed}
                        onChange={this.handleValueChange}
                        invalid={invalid}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        value={value != null ? value : ""}
                        placeholder={this.state.placeholder}
                    />
                );
            case displayTypes.numberInput:
                return (
                    <input
                        type="text"
                        id={id}
                        disabled={disabled}
                        onChange={e => this.handleSimpleChange(e, propDesc.type)}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        value={value != null ? value : ""}
                        placeholder={this.state.placeholder}
                        className={cn}
                    />
                );
            case displayTypes.select:
                return (
                    <div className="select-control">
                        <select
                            disabled={disabled}
                            onChange={this.handleSimpleChange}
                            onBlur={this.handleBlur}
                            onFocus={this.handleFocus}
                            value={value != null ? value : ""}
                            className={cn}
                        >
                            {this.state.fieldOptionsControls}
                        </select>
                        <i className="material-icons arrow">arrow_drop_down</i>
                    </div>
                );
            case displayTypes.textArea:
                return (
                    <TextArea
                        disabled={disabled}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        value={value != null ? value : ""}
                        placeholder={this.state.placeholder}
                        className={cn}
                    />
                );
            case displayTypes.checkbox:
                return (
                    <CheckBox
                        id={id}
                        disabled={disabled}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        checked={value != null ? value : false}
                    />
                );
            case displayTypes.radio:
                return (
                    <Radio
                        disabled={disabled}
                        options={this.state.fieldOptions}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        value={value}
                    />
                );
            case displayTypes.masked:
                return (
                    <MaskedInput
                        mask={propDesc.mask.getValue(this.props.user, this.props.combinedItem, this.props.baseItem)}
                        disabled={disabled}
                        small
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        value={value}
                    />
                );
            case displayTypes.searchBox:
                return (
                    <SearchBox
                        value={value}
                        storeName={this.props.storeName}
                        propDesc={propDesc}
                        disabled={disabled}
                        onChange={this.handleRefChange}
                        onOptionsLoaded={this.handleSearchBoxOptionsLoaded}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        performAction={this.props.performAction}
                        item={item}
                        baseItem={baseItem}
                        combinedBaseItem={combinedBaseItem}
                        user={user}
                    />
                );
            case displayTypes.checkList:
                return (
                    <CheckList
                        value={value}
                        store={propDesc.store}
                        storeName={this.props.storeName}
                        pro
                        options={this.state.fieldOptions}
                        disabled={disabled}
                        disabledOptions={propDesc.disableCurrent ? [this.props.item._id] : []}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                    />
                );
            case displayTypes.password:
                return (
                    <input
                        type="password"
                        id={id}
                        onChange={this.handleSimpleChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        disabled={disabled}
                        value={value != null ? value : ""}
                        pattern={propDesc.pattern}
                        className={cn}
                        autoComplete="off"
                    />
                );
            case displayTypes.code:
                return (
                    <pre className="code-display" id={id}>
                        {value}
                    </pre>
                );
            case displayTypes.codeEditor:
                return (
                    <CodeEditor
                        value={value}
                        disabled={disabled}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                    />
                );
            case displayTypes.datePicker:
                return (
                    <DatePicker
                        className={cn}
                        value={value != null ? value : ""}
                        disabled={disabled}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        utc={propDesc.utc}
                    />
                );
            case displayTypes.dateTimePicker:
                return (
                    <DateTimePicker
                        className={cn}
                        value={value}
                        disabled={disabled}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        shouldComponentUpdate={this.props.shouldComponentUpdate}
                        utc={propDesc.utc}
                    />
                );
            case displayTypes.dateRange:
                return (
                    <DateRange
                        className={cn}
                        value={value != null ? value : ""}
                        disabled={disabled}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                        shouldComponentUpdate={this.props.shouldComponentUpdate}
                        utc={propDesc.utc}
                    />
                );
            case displayTypes.numberRange:
                return (
                    <NumberRange
                        className={cn}
                        value={value != null ? value : ""}
                        disabled={disabled}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                    />
                );
            case displayTypes.stringRange:
                return (
                    <StringRange
                        className={cn}
                        value={value != null ? value : ""}
                        disabled={disabled}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        type={propDesc.type}
                        onFocus={this.handleFocus}
                    />
                );
            case displayTypes.colorPicker:
                return (
                    <ColorPicker
                        id={id}
                        className={cn}
                        colors={this.state.fieldOptions.map(i => i.value)}
                        disableCustomInput={propDesc.disableCustomInput}
                        value={value != null ? value : ""}
                        disabled={disabled}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                    />
                );
            case displayTypes.filePicker:
                if (propDesc.type !== propertyTypes.file && propDesc.type !== propertyTypes.fileList) {
                    return <p>Invalid property type </p>;
                }
                return (
                    <FilePicker
                        id={id}
                        value={value}
                        targetStore={propDesc.store}
                        itemId={this.props.item._id}
                        multiple={propDesc.type === propertyTypes.fileList}
                        accept={propDesc.accept}
                        onChange={this.handleValueChange}
                        onBlur={this.handleBlur}
                        disabled={disabled}
                        disableAdding={this.state.access.indexOf("c") < 0}
                        disableDeleting={this.state.access.indexOf("d") < 0}
                    />
                );
            case displayTypes.html:
                return (
                    <Html
                        className={cn}
                        html={propDesc.html}
                        model={Object.assign({ value: value }, this.getTemplateModel())}
                        disabled={disabled}
                    />
                );
            case displayTypes.none:
                return null;
            case displayTypes.headerInput:
                return (
                    <div className="flex">
                        <input
                            type="text"
                            id="name-input"
                            onChange={this.handleSimpleChange}
                            onBlur={this.handleBlur}
                            onFocus={this.handleFocus}
                            value={value != null ? value : ""}
                            className="header-input"
                            disabled={disabled}
                            placeholder={this.state.placeholder}
                            form="item-view-form"
                        />
                        <span className={this.state.changed ? "changed" : ""}>*</span>
                    </div>
                );
            case displayTypes.timePicker:
            default:
                return <p>{propDesc.display}- not implemented</p>;
        }
    }
}

SimpleInput.propTypes = {
    fieldName: PropTypes.string.isRequired,
    field: PropTypes.object.isRequired,
    item: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};
SimpleInput.defaultProps = { item: {} };

export default SimpleInput;
