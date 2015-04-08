import Config = require('./config');
import ErrorHandling = require('./error-handling');
import Queries = require('../core/queries/queries');
import Api = require('../core/api');
import _ = require('underscore');
import Common = require('./visualization');
import Loader = require('./loader');
import ResultHandling = require('./result-handling');
import Dom = require('./dom');

class Text implements Common.Visualization {
    public targetElement: HTMLElement;
    public loader: Loader;
    private _options: Config.TextOptions;
    private _rendered: boolean;
    private _valueTextElement: HTMLElement;
    private _titleElement: HTMLElement;

    constructor(targetElement: string|HTMLElement, textOptions: Config.TextOptions) {
        this._options = _.extend({ 
            fieldOptions: {} 
        }, textOptions);

        this.targetElement = Dom.getElement(targetElement);
        this.loader = new Loader(this.targetElement);
    }

    public displayData(resultsPromise: Q.IPromise<Api.QueryResults>, metadata: Queries.Metadata, showLoader: boolean = true): void {        
        this._renderText(metadata);

        if (!this._checkMetaDataIsApplicable(metadata)){
            this._renderQueryNotApplicable();
            return;
        }        

        ResultHandling.handleResult(resultsPromise, metadata, this, this._loadData, showLoader);
    }

    private _loadData(results: Api.QueryResults, metadata: Queries.Metadata): void {        
        var options = this._options,
            onlyResult = results[0],
            aliasOfSelect = metadata.selects[0],
            defaultFieldOption = { valueFormatter: (value) => value },
            fieldOption = options.fieldOptions[aliasOfSelect] || defaultFieldOption,
            valueFormatter = fieldOption.valueFormatter,
            value = onlyResult[aliasOfSelect],
            valueText = valueFormatter(value);

        this._valueTextElement.textContent = valueText;
        this._showTitle(metadata);
    }

    public clear(): void{        
        this._rendered = false;
        Dom.removeAllChildren(this.targetElement);
    }

    private _checkMetaDataIsApplicable(metadata: Queries.Metadata): boolean {
        var exactlyOneSelect = metadata.selects.length === 1,
            noGroupBys = metadata.groups.length === 0,
            noInterval = metadata.interval == null;

        return exactlyOneSelect && noGroupBys && noInterval;
    }

    private _showTitle(metadata: Queries.Metadata){
        var options = this._options,
            aliasOfSelect = metadata.selects[0],
            title = options.title,
            titleText = title && (<string>title).length > 0 ? title.toString() : aliasOfSelect,
            showTitle = title !== false;

        this._titleElement.textContent = titleText;
        this._titleElement.style.display = !showTitle ? 'none' : '';
    }

    private _renderText(metadata){
        if (this._rendered)
            return;

        var container = document.createElement('div'),
            label = document.createElement('span'),
            elementForWidget = this.targetElement,
            valueTextElement = document.createElement('span'),
            valueElement = document.createElement('div');

        container.className = 'connect-viz connect-text';
        label.className = 'connect-viz-title';
        valueElement.className = 'connect-viz-result connect-text-value';

        this.clear();
        valueElement.appendChild(valueTextElement);
        container.appendChild(label);
        container.appendChild(valueElement);
        elementForWidget.appendChild(container);

        this._valueTextElement = valueTextElement;
        this._valueTextElement.innerHTML = '&nbsp;'
        this._titleElement = label;
        this._showTitle(metadata);        
        this._rendered = true;
    }

    private _renderQueryNotApplicable(){
        this._rendered = false;
        ErrorHandling.displayFriendlyError(this.targetElement, 'unsupportedQuery');
    }
}

export = Text;