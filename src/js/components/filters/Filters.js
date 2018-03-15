import React from "react";
import PropTypes from "prop-types";
import SimpleInput from "../forms/inputs/SimpleInput";
import SimpleForm from "../forms/SimpleForm";
import PinToggle from "../misc/Pin";
import i18n from "../../stores/i18nStore";
import filtersStore from "../../stores/filtersStore";
import filtersActions from "../../actions/filtersActuators.js";
import preferencesActions from "../../actions/preferencesActuators";
import configStore from "../../stores/configStore.js";
import credentialsStore from "../../stores/credentialsStore";
import alerts from "../../utils/alertsEmitter";
import { storeEvents, displayTypes } from "constants";
import order from "utils/order";
import classnames from "classnames";
import template from "template";

export default class Filters extends React.Component {
    constructor(props) {
        super(props);
        this.state = { savedFilters: [] };
        this.state.filtersDesc = configStore.getConfig(this.props.storeName).filters || [];
        this.state.enableSavingFilters = configStore.getConfig(this.props.storeName).enableSavingFilters || false;
        this.state.filters = filtersStore.getFilters(this.props.storeName);
        this.state.pin = this.props.pin === true;
        this.state.overflow = "auto";
        this._onFilterChange = this._onFilterChange.bind(this);
        this._onFiltersLoaded = this._onFiltersLoaded.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.cancelSavingFilter = this.cancelSavingFilter.bind(this);

        filtersActions.loadSavedFilters(this.props.storeName);
    }

    handleFilterChange(filterName, value) {
        filtersActions.setFilter(this.props.storeName, filterName, value);
    }

    clear(e) {
        e.preventDefault();
        filtersActions.clearFilter(this.props.storeName);
        if (typeof this.props.onClear === "function") {
            this.props.onClear();
        }
    }

    openLoadingForm(e) {
        e.preventDefault();
        this.setState({ showFilterLoadForm: true });
    }

    openSavingForm(e) {
        e.preventDefault();
        this.setState({ showFilterSaverForm: true });
        this.handleFilterSavingDataChange({ filters: [] });
    }

    pin(e) {
        this.setState({ pin: !this.state.pin });
    }

    handleFocus(fieldDisplay) {
        if (fieldDisplay === displayTypes.dateRange) {
            this.setState({ overflow: "visible" });
        }
    }

    handleBlur(fieldDisplay) {
        if (fieldDisplay === displayTypes.dateRange) {
            this.setState({ overflow: "auto" });
        }
    }

    cancelSavingFilter(e) {
        e && e.preventDefault();
        if (!e || e.target === this.refs.formContainer) {
            this.setState({ showFilterSaverForm: false, showFilterLoadForm: false, filterToLoad: null });
            this.handleFilterSavingDataChange({ filters: [] });
        }
    }

    handleFilterSavingDataChange(data) {
        this.setState({ selectedFilters: data });
    }

    handleFilterLoadChange(data) {
        this.setState({ filterToLoad: data.name });
    }

    saveFilter() {
        const { name, filters } = this.state.selectedFilters;
        if (filters.length === 0) {
            alerts.error(i18n.get("filters.noFiltersError"));

            return;
        }

        if (!name) {
            alerts.error(i18n.get("filters.noFilterNameError"));

            return;
        }

        const { storeName } = this.props;
        const currentFilters = filtersStore.getFilters(storeName);
        const filtersToSave = {};
        for (const propName of filters) {
            filtersToSave[propName] = currentFilters[propName] || null;
        }

        filtersActions.saveFilter(storeName, name, filtersToSave);
        this.cancelSavingFilter();
        alerts.info(i18n.get("filters.filterSaved"));
    }

    loadFilter() {
        const filterName = this.state.filterToLoad;
        if (!filterName) {
            alerts.error(i18n.get("filters.noFilterSelectedForLoading"));

            return;
        }

        const savedFilters = filtersStore.savedFilters();
        for (const f of savedFilters) {
            if (f.name === filterName) {
                const { storeName } = this.props;
                filtersActions.loadFilters(storeName, f.filter);

                this.cancelSavingFilter();
                alerts.info(i18n.get("filters.filterSaved"));

                return;
            }
        }

        alerts.error(i18n.get("filters.filterNotFound"));
    }

    getFilterSavingProps(filters) {
        return {
            name: {
                type: "string",
                display: "textInput",
                label: () => i18n.get("filters.filterName"),
                hidden: () => false,
                disabled: () => false,
                required: () => true,
                groupAccess: "ru",
                ownerAccess: "ru",
                formOrder: 10,
                style: { width: "150px" },
            },
            filters: {
                type: "any",
                display: "checkList",
                label: () => i18n.get("filters.paramsToSave"),
                hidden: () => false,
                disabled: () => false,
                required: () => true,
                groupAccess: "ru",
                ownerAccess: "ru",
                options: filters.filter(e => e.name !== "_default").map(e => ({ label: e.label, value: e.name })),
                formOrder: 20,
            },
        };
    }

    getFilterLoadingProps(filters) {
        const savedFilters = filtersStore.savedFilters();

        return {
            name: {
                type: "any",
                display: "select",
                label: () => i18n.get("filters.filterToLoad"),
                hidden: () => false,
                disabled: () => false,
                required: () => true,
                groupAccess: "ru",
                ownerAccess: "ru",
                options: savedFilters.map(e => ({ label: () => e.name, value: e.name })),
                formOrder: 10,
                style: { width: "150px" },
            },
        };
    }

    render() {
        const filters = Object.keys(this.state.filtersDesc).map((filterName) => {
            const filter = Object.assign({}, this.state.filtersDesc[filterName]);
            filter.name = filterName;
            return filter;
        });

        order.by(filters, "formOrder");
        const user = credentialsStore.getUser();
        const filterControls = filters.map((filter, index) => {
            if (filter.hidden(user, this.state.filters) || filter.display === "none" || filter.name.indexOf("_") === 0) {
                return null;
            }

            return (
                <SimpleInput fieldName={filter.name}
                    key={filter.name + "-" + index}
                    field={filter}
                    storeName={this.props.storeName}
                    item={this.state.filters}
                    timeout={1000}
                    onChange={this.handleFilterChange.bind(this)}
                    value={this.state.filters[filter.name]}
                    onFocus={this.handleFocus.bind(this, filter.display)}
                    onBlur={this.handleBlur.bind(this, filter.display)}
                    className="filter">
                </SimpleInput>
            );
        });

        const filterSavingProps = this.getFilterSavingProps(filters);
        const filterLoadingProps = this.getFilterLoadingProps();

        const templateModel = {
            $i18n: i18n.getForStore(this.props.storeName),
            $user: user,
            $item: this.props.item,
        };
        const okLabel = template.render("", templateModel) || "OK";
        const cancelLabel = template.render("", templateModel) || "Cancel";
        const style = { paddingLeft: 0, paddingRight: 0 };
        const filterSaverForm = this.state.showFilterSaverForm
            ? <div className="item-actions">
                <div className="action-form-modal"
                    ref="formContainer"
                    style={style}
                    onClick={this.cancelSavingFilter}>
                    <div className="action-form">
                        <span className="title m-b-14">
                            {i18n.get("filters.saveFilterTitle")}
                        </span>
                        <SimpleForm storeDesc={{ props: filterSavingProps }}
                            storeName={this.props.storeName}
                            item={Object.assign({}, this.state.selectedFilters)}
                            onChange={this.handleFilterSavingDataChange.bind(this)}
                            cancel={this.cancelSavingFilter}
                            onSubmit={this.saveFilter.bind(this)}
                            // onSubmitError={this.setDataTouched.bind(this)}
                            saveClass={"btn-flat last" + (this.props.dark ? " btn-flat-dark" : "")}
                            saveIcon={null}
                            saveText={i18n.get("form.save")}
                            cancelClass={"btn-flat first" + (this.props.dark ? " btn-flat-dark" : "")}
                            cancelIcon={null}
                            cancelText={i18n.get("form.cancel")}
                            buttonsContainerClassName="action-buttons"
                            directWrite={true}
                            user={user}
                            dark={this.props.dark} />
                    </div>
                </div>
            </div>
            : null;

        const filterLoadForm = this.state.showFilterLoadForm
            ? <div className="item-actions">
                <div className="action-form-modal"
                    ref="formContainer"
                    style={style}
                    onClick={this.cancelSavingFilter}>
                    <div className="action-form">
                        <span className="title m-b-14">
                            {i18n.get("filters.loadFilterTitle")}
                        </span>
                        <SimpleForm storeDesc={{ props: filterLoadingProps }}
                            storeName={this.props.storeName}
                            item={Object.assign({}, { name: this.state.filterToLoad })}
                            onChange={this.handleFilterLoadChange.bind(this)}
                            cancel={this.cancelSavingFilter}
                            onSubmit={this.loadFilter.bind(this)}
                            // onSubmitError={this.setDataTouched.bind(this)}
                            saveClass={"btn-flat last" + (this.props.dark ? " btn-flat-dark" : "")}
                            saveIcon={null}
                            saveText={i18n.get("filters.loadButton")}
                            cancelClass={"btn-flat first" + (this.props.dark ? " btn-flat-dark" : "")}
                            cancelIcon={null}
                            cancelText={i18n.get("form.cancel")}
                            buttonsContainerClassName="action-buttons"
                            directWrite={true}
                            user={user}
                            dark={this.props.dark} />
                    </div>
                </div>
            </div>
            : null;

        const filtersSaverControls = this.state.enableSavingFilters
            ? <div style={{ margin: "7px 20px" }}>
                <button onClick={this.openLoadingForm.bind(this)}
                    tabIndex="-1"
                    className="btn-flat first">
                    {i18n.get("filters.loadButton")}
                </button>
                <button onClick={this.openSavingForm.bind(this)}
                    tabIndex="-1"
                    className="btn-flat first">
                    {i18n.get("filters.saveButton")}
                </button>

                {filterSaverForm}
                {filterLoadForm}
            </div>
            : null;

        const cn = classnames("filters", {
            show: this.props.show,
            pinned: this.state.pin,
        });

        return (
            <div className={cn} ref="root" style={{ overflow: this.state.overflow }}>
                <div className="relative">
                    <PinToggle onClick={this.pin.bind(this)} pinned={this.state.pin} />
                </div>
                <div style={{ margin: "14px 0 0 20px", flexShrink: "0" }}>
                    <span className="subheading light-secondary">
                        {i18n.get("filters.title")}
                    </span>
                </div>
                <div className="pd-filters">
                    <div>{filterControls}</div>
                </div>
                <div style={{ margin: "7px 20px" }}>
                    <button onClick={this.clear.bind(this)}
                        tabIndex="-1"
                        className="btn-flat first">
                        {i18n.get("filters.clear")}
                    </button>
                </div>

                {filtersSaverControls}
            </div>
        );
    }

    handleDocumentClick(e) {
        if (this.props.show && !this.state.pin) {
            var root = this.refs["root"];
            if (e.target === root || root.contains(e.target) || e.defaultPrevented) {
                return;
            }

            preferencesActions.setPreference(this.props.storeName + "-show-filters", false);
        }
    }

    componentDidMount() {
        filtersStore.on(storeEvents.CHANGED, this._onFilterChange);
        filtersStore.on(storeEvents.FILTERS_LOADED, this._onFiltersLoaded);
        if (this.props.show) {
            document.addEventListener("click", this.handleDocumentClick);
        }
    }

    componentWillUnmount() {
        filtersStore.removeListener(storeEvents.CHANGED, this._onFilterChange);
        filtersStore.removeListener(storeEvents.FILTERS_LOADED, this._onFiltersLoaded);
        document.removeEventListener("click", this.handleDocumentClick);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.storeName !== nextProps.storeName) {
            this.setState({
                filtersDesc: configStore.getConfig(nextProps.storeName).filters || [],
                filters: filtersStore.getFilters(nextProps.storeName),
            });
        }

        if (nextProps.show && !this.props.show) {
            document.addEventListener("click", this.handleDocumentClick);
        }

        if (!nextProps.show && this.props.show) {
            document.removeEventListener("click", this.handleDocumentClick);
            this.cancelSavingFilter();
        }

        if (nextProps.pin === true && this.state.pin !== true) {
            this.setState({ pin: true });
        }
    }

    _onFilterChange() {
        this.setState({ filters: filtersStore.getFilters(this.props.storeName) });
    }

    _onFiltersLoaded(payload) {
        console.info("payload", payload);
    }

    __onDispatch(payload) {
        console.info("__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch__onDispatch", payload);
        switch (payload.actionType) {
            case storeEvents.FILTERS_LOADED:
                console.info(":PAYLOAD", payload);
        }
    }
}

Filters.propTypes = {
    storeName: PropTypes.string.isRequired,
    show: PropTypes.bool,
    onClear: PropTypes.func,
};
Filters.defaultProps = {};