

//Install "en" translations
ws.installLanguage({
  language: 'en',
  entries: {
    confirmNewChart:
      'Are you sure you want to abandon the current chart and start over?',
    previewChart: 'Preview Chart',
    newChart: 'New Chart',
    saveProject: 'Save Project',
    loadProject: 'Load Project',
    exportPNG: 'Export as PNG',
    exportJPEG: 'Export as JPEG',
    exportSVG: 'Export as SVG',
    exportPDF: 'Export as PDF',
    loadCloud: 'Load From Cloud',
    saveCloud: 'Save To Cloud',
    help: 'Help',
    licenseInfo: 'License Information',
    stepDone: 'Done',
    stepStart: 'Start',
    stepImport: 'Import',
    stepTemplates: 'Templates',
    stepCustomize: 'Customize',
    stepExport: 'Export',
    stepData: 'Data',
    doneCaption: 'Close & Generate Chart',
    dgDeleteRow: 'Really delete the selected rows?',
    dgWithSelected: 'With Selection:',
    dgImportBtn: 'IMPORT',
    dgExportBtn: 'EXPORT DATA',
    dgNewBtn: 'Clear',
    dgAddRow: 'ADD ROW',
    dgDataImported: 'Data imported',
    dgDataImporting: 'Importing data',
    dgNewCol: 'New Column',
    dgSortAsc: 'Sort Ascending',
    dgSortDec: 'Sort Descending',
    dgSortAscMonth: 'Sort as Month Names Ascending',
    dgSortDecMonth: 'Sort as Month Names Decending',
    dgDelCol: 'Delete Column',
    dgDelColConfirm: 'Really delete the column?',
    dgInsColBefore: 'Insert Column Before',
    dgInsColAfter: 'Insert Column After',
    customizeSimple: 'SIMPLE',
    customizeAdvanced: 'ADVANCED',
    customizeCustomCode: 'CUSTOM CODE',
    customizePreview: 'PREVIEW OPTIONS',
    'option.cat.title': 'Titles',
    'option.cat.chart': 'Chart',
    'option.subcat.dimension': 'Dimensions',
    'option.subcat.title': 'Title',
    'option.subcat.appearance': 'Appearance',
    'option.subcat.tooltip': 'Tooltip',
    'option.subcat.credit': 'Credits',
    'option.subcat.titles': 'Main titles',
    'option.cat.general': 'General',
    'option.subcat.size': 'Chart size',
    'option.subcat.interaction': 'Interaction',
    'option.cat.appearance': 'Appearance',
    'option.subcat.fonts': 'Fonts',
    'option.subcat.titlestyle': 'Title Style',
    'option.subcat.seriescolors': 'Series Colors',
    'option.subcat.chartarea': 'Chart Area',
    'option.subcat.plotarea': 'Plot Area',
    'option.cat.axes': 'Axes',
    'option.subcat.axessetup': 'Axes Setup',
    'option.subcat.xaxis': 'X Axis',
    'option.subcat.yaxis': 'Y Axis',
    'option.cat.series': 'Data Series',
    'option.cat.labels': 'Value Labels',
    'option.subcat.labels': 'Value Labels',
    'option.cat.legend': 'Legend',
    'option.subcat.general': 'General',
    'option.subcat.placement': 'Placement',
    'option.subcat.legendappearance': 'Appearance',
    'option.cat.tooltip': 'Tooltip',
    'option.subcat.colorborder': 'Color and Border',
    'option.cat.export': 'Export',
    'option.cat.exporting': 'Exporting',
    'option.cat.localization': 'Localization',
    'option.subcat.numberformat': 'Number formatting',
    'option.subcat.exportbutton': 'Exporting Menu',
    'option.subcat.zoombutton': 'Zoom button',
    'option.cat.credits': 'Credits',
    'option.series.label': 'Series Labels',
    'option.text.series.label.enabled': 'Series label',
    'option.tooltip.series.label.enabled':
      'Enable or disable the series label. Series labels are placed as close to the series as possible in a natural way, seeking to avoid other series. The goal of this feature is to make the chart more easily readable, like if a human designer placed the labels in the optimal position.',
    'option.text.series.label.style': 'Series label style',
    'options.tooltip.series.label.style': '',
    'option.text.title.text': 'Chart title',
    'option.tooltip.title.text': 'The main chart title.',
    'option.text.subtitle.text': 'Chart subtitle',
    'option.tooltip.subtitle.text':
      "The chart's subtitle, normally displayed with smaller fonts below the main title.",
    'option.text.yAxis.title.text': 'Y axis title',
    'option.tooltip.yAxis.title.text':
      'The Y axis title, normally displayed vertically along the Y axis.',
    'option.text.chart.width': 'Chart width',
    'option.tooltip.chart.width':
      'An explicit width for the chart. By default (when <code>null</code>) the width is calculated from the offset width of the containing element.',
    'option.text.chart.height': 'Chart height',
    'option.tooltip.chart.height':
      "An explicit height for the chart. By default (when <code>null</code>) the height is calculated from the offset height of the containing element, or 400 pixels if the containing element's height is 0.",
    'option.text.chart.zoomType': 'Allow zooming',
    'option.tooltip.chart.zoomType':
      'Decides in what dimensions the user can zoom by dragging the mouse. Can be one of <code>x</code>, <code>y</code> or <code>xy</code>.',
    'option.text.plotOptions.series.states.inactive.opacity': 'Series Dimming',
    'option.tooltip.plotOptions.series.states.inactive.opacity':
      'Opacity of series elements (dataLabels, line, area).',
    'option.text.chart.polar': 'Polar (radar) projection',
    'option.tooltip.chart.polar':
      'When true, cartesian charts like line, spline, area and column are transformed into the polar coordinate system. Requires <code>highcharts-more.js</code>.',
    'option.text.chart.style': 'Font family',
    'option.tooltip.chart.style': 'The font to use throughout the chart',
    'option.text.title.style': 'Main title style',
    'option.tooltip.title.style': 'Styling for the main chart title',
    'option.text.subtitle.style': 'Subtitle style',
    'option.tooltip.subtitle.style':
      "Styling for the chart's subtitle, normally displayed with smaller fonts below the main title",
    'option.text.colors': 'Colors',
    'option.tooltip.colors':
      'Default colors for the data series, or for individual points in a pie series or a column series with individual colors. Colors will be picked in succession. If a color is explicitly set for each series in the <em>Data series</em> view, that color will take precedence.',
    'option.text.chart.backgroundColor': 'Background color',
    'option.tooltip.chart.backgroundColor':
      'Background color for the full chart area',
    'option.text.chart.borderWidth': 'Border width',
    'option.tooltip.chart.borderWidth':
      'The pixel width of the outer chart border.',
    'option.text.chart.borderRadius': 'Border corner radius',
    'option.tooltip.chart.borderRadius':
      'The corner radius of the outer chart border.',
    'option.text.chart.borderColor': 'Border color',
    'option.tooltip.chart.borderColor': 'The color of the outer chart border.',
    'option.text.chart.plotBackgroundColor': 'Background color',
    'option.tooltip.chart.plotBackgroundColor':
      'Background color for the plot area, the area inside the axes',
    'option.text.chart.plotBackgroundImage': 'Background image URL',
    'option.tooltip.chart.plotBackgroundImage':
      'The online URL for an image to use as the plot area background',
    'option.text.chart.plotBorderWidth': 'Border width',
    'option.tooltip.chart.plotBorderWidth':
      'The pixel width of the plot area border.',
    'option.text.chart.plotBorderColor': 'Border color',
    'option.tooltip.chart.plotBorderColor':
      'The color of the inner chart or plot area border.',
    'option.text.chart.inverted': 'Inverted axes',
    'option.tooltip.chart.inverted':
      '<p>Whether to invert the axes so that the x axis is vertical and y axis is horizontal. When true, the x axis is <a href="#xAxis.reversed">reversed</a> by default. If a bar series is present in the chart, it will be inverted automatically.</p>\r\n\r\n<p>Inverting the chart doesn\'t have an effect if there are no cartesian series in the chart, or if the chart is <a href="#chart.polar">polar</a>.</p>',
    'option.text.xAxis.title.style': 'X axis title',
    'option.tooltip.xAxis.title.style': 'Styling and text for the X axis title',
    'option.text.xAxis.title.text': 'Text',
    'option.tooltip.xAxis.title.text':
      'The actual text of the axis title. It can contain basic HTML text markup like &lt;b&gt;, &lt;i&gt; and spans with style.',
    'option.text.xAxis.type': 'Type',
    'option.tooltip.xAxis.type': 'The type of axis',
    'option.text.xAxis.opposite': 'Opposite side of chart',
    'option.tooltip.xAxis.opposite':
      'Whether to display the axis on the opposite side of the normal. The normal is on the left side for vertical axes and bottom for horizontal, so the opposite sides will be right and top respectively. This is typically used with dual or multiple axes.',
    'option.text.xAxis.margin': 'Margin',
    'option.tooltip.xaxis.margin':
      'If there are multiple axes on the same side of the chart, the pixel margin between the axes.',
    'option.text.xAxis.reversed': 'Reversed direction',
    'option.tooltip.xAxis.reversed':
      'Whether to reverse the axis so that the highest number is closest to the origin. If the chart is inverted, the x axis is reversed by default.',
    'option.text.xAxis.labels.format': 'Axis labels format',
    'option.tooltip.xAxis.labels.format':
      '<p>A format string for the axis labels. The value is available through a variable <code>{value}</code>.</p><p><b>Units</b> can be added for example like <code>{value} USD</code>.</p><p><b>Formatting</b> can be added after a colon inside the variable, for example <code>USD {value:.2f}</code> to display two decimals, or <code>{value:%Y-%m-%d}</code> for a certain time format.',
    'option.text.yAxis.title.style': 'Y axis title style',
    'option.tooltip.yAxis.title.style': 'Styling and text for the X axis title',
    'option.text.yAxis.type': 'Type',
    'option.tooltip.yAxis.type': 'The type of axis',
    'option.text.yAxis.opposite': 'Opposite side of chart',
    'option.tooltip.yAxis.opposite':
      'Whether to display the axis on the opposite side of the normal. The normal is on the left side for vertical axes and bottom for horizontal, so the opposite sides will be right and top respectively. This is typically used with dual or multiple axes.',
    'option.text.yAxis.reversed': 'Reversed direction',
    'option.tooltip.yAxis.reversed':
      'Whether to reverse the axis so that the highest number is closest to the origin. If the chart is inverted, the x axis is reversed by default.',
    'option.text.yAxis.labels.format': 'Axis labels format',
    'option.tooltip.yAxis.labels.format':
      '<p>A format string for the axis labels. The value is available through a variable <code>{value}</code>.</p><p><b>Units</b> can be added for example like <code>{value} USD</code>.</p><p><b>Formatting</b> can be added after a colon inside the variable, for example <code>USD {value:.2f}</code> to display two decimals, or <code>{value:%Y-%m-%d}</code> for a certain time format.',
    'option.text.series.type': 'Series type',
    'option.tooltip.series.type': 'The type of series',
    'option.text.series.color': 'Color',
    'option.tooltip.series.color':
      'The main color of the series. If no color is given here, the color is pulled from the array of default colors as given in the "Appearance" section.',
    'option.text.series.negativeColor': 'Negative color',
    'option.tooltip.series.negativeColor':
      'The negative color of the series below the threshold. Threshold is default zero, this can be changed in the advanced settings.',
    'option.text.series.colorByPoint': 'Color by point',
    'option.tooltip.series.colorByPoint':
      'Use one color per point. Colors can be changed in the "Appearance" section.',
    'option.text.series.dashStyle': 'Dash style',
    'option.tooltip.series.dashStyle':
      'A name for the dash style to use for the graph. Applies only to series type having a graph, like <code>line</code>, <code>spline</code>, <code>area</code> and <code>scatter</code> in  case it has a <code>lineWidth</code>. The value for the <code>dashStyle</code> include:\r\n\t\t    <ul>\r\n\t\t    \t<li>Solid</li>\r\n\t\t    \t<li>ShortDash</li>\r\n\t\t    \t<li>ShortDot</li>\r\n\t\t    \t<li>ShortDashDot</li>\r\n\t\t    \t<li>ShortDashDotDot</li>\r\n\t\t    \t<li>Dot</li>\r\n\t\t    \t<li>Dash</li>\r\n\t\t    \t<li>LongDash</li>\r\n\t\t    \t<li>DashDot</li>\r\n\t\t    \t<li>LongDashDot</li>\r\n\t\t    \t<li>LongDashDotDot</li>\r\n\t\t    </ul>',
    'option.text.series.marker.enabled': 'Enable point markers',
    'option.tooltip.series.marker.enabled':
      'Enable or disable the point marker. If <code>null</code>, the markers are hidden when the data is dense, and shown for more widespread data points.',
    'option.text.series.marker.symbol': 'Marker symbol',
    'option.tooltip.series.marker.symbol':
      '<p>A predefined shape or symbol for the marker. When null, the symbol is pulled from options.symbols. Other possible values are "circle", "square", "diamond", "triangle" and "triangle-down".</p>\r\n\r\n<p>Additionally, the URL to a graphic can be given on this form:  "url(graphic.png)". Note that for the image to be applied to exported charts, its URL needs to be accessible by the export server.</p>\r\n\r\n<p>Custom callbacks for symbol path generation can also be added to <code>Highcharts.SVGRenderer.prototype.symbols</code>. The callback is then used by its method name, as shown in the demo.</p>',
    'option.text.plotOptions.series.dataLabels.enabled':
      'Enable data labels for all series',
    'option.tooltip.plotOptions.series.dataLabels.enabled':
      'Show small labels next to each data value (point, column, pie slice etc)',
    'option.text.plotOptions.series.dataLabels.style': 'Text style',
    'option.tooltip.plotOptions.series.dataLabels.style':
      'Styles for the label.',
    'option.text.legend.enabled': 'Enable legend',
    'option.tooltip.legend.enabled': 'Enable or disable the legend.',
    'option.text.legend.layout': 'Item layout',
    'option.text.legend.labelFormat': 'Label Format',
    'option.tooltip.legend.labelFormat':
      'A format string for each legend label',
    'option.tooltip.legend.layout':
      'The layout of the legend items. Can be one of "horizontal" or "vertical".',
    'option.text.legend.align': 'Horizontal alignment',
    'option.tooltip.legend.align':
      '<p>The horizontal alignment of the legend box within the chart area. Valid values are <code>left</code>, <code>center</code> and <code>right</code>.</p>\r\n\r\n<p>In the case that the legend is aligned in a corner position, the <code>layout</code> option will determine whether to place it above/below or on the side of the plot area.</p>',
    'option.text.legend.x': 'Horizontal offset',
    'option.tooltip.legend.x':
      'The pixel offset of the legend relative to its alignment',
    'option.text.legend.verticalAlign': 'Vertical alignment',
    'option.tooltip.legend.verticalAlign':
      '<p>The vertical alignment of the legend box. Can be one of <code>top</code>, <code>middle</code> or  <code>bottom</code>. Vertical position can be further determined by the <code>y</code> option.</p>\r\n\r\n<p>In the case that the legend is aligned in a corner position, the <code>layout</code> option will determine whether to place it above/below or on the side of the plot area.</p>',
    'option.text.legend.y': 'Vertical offset',
    'option.tooltip.legend.y':
      'The pixel offset of the legend relative to its alignment',
    'option.text.legend.floating': 'Float on top of plot area',
    'option.tooltip.legend.floating':
      'When the legend is floating, the plot area ignores it and is allowed to be placed below it.',
    'option.text.legend.itemStyle': 'Text style',
    'option.tooltip.legend.itemStyle':
      'CSS styles for each legend item. Only a subset of CSS is supported, notably those options related to text.',
    'option.text.legend.itemHiddenStyle': 'Text style hidden',
    'option.tooltip.legend.itemHiddenStyle':
      'CSS styles for each legend item when the corresponding series or point is hidden. Only a subset of CSS is supported, notably those options related to text. Properties are inherited from <code>style</code> unless overridden here.',
    'option.text.legend.backgroundColor': 'Background color',
    'option.tooltip.legend.backgroundColor':
      'The background color of the legend.',
    'option.text.legend.borderWidth': 'Border width',
    'option.tooltip.legend.borderWidth':
      'The width of the drawn border around the legend.',
    'option.text.legend.borderRadius': 'Border corner radius',
    'option.tooltip.legend.borderRadius':
      'The border corner radius of the legend.',
    'option.text.legend.borderColor': 'Border color',
    'option.tooltip.legend.borderColor':
      'The color of the drawn border around the legend.',
    'option.text.tooltip.enabled': 'Enable tooltip',
    'option.tooltip.tooltip.enabled':
      'Enable or disable the tooltip. The tooltip is the information box that appears on mouse-over or touch on a point.',
    'option.text.tooltip.shared': 'Shared between series',
    'option.tooltip.tooltip.shared':
      'When the tooltip is shared, the entire plot area will capture mouse movement or touch events. Tooltip texts for series types with ordered data (not pie, scatter, flags etc) will be shown in a single bubble. This is recommended for single series charts and for tablet/mobile optimized charts.',
    'option.text.tooltip.backgroundColor': 'Background color',
    'option.tooltip.tooltip.backgroundColor':
      'The background color of the tooltip',
    'option.text.tooltip.valueSuffix': 'Value Suffix',
    'option.tooltip.tooltip.valueSuffix':
      'A string to append to each series y value',
    'option.text.tooltip.borderWidth': 'Border width',
    'option.tooltip.tooltip.borderWidth':
      '<p>The pixel width of the tooltip border.</p>\r\n\r\n<p>In <a href="http://www.highcharts.com/docs/chart-design-and-style/style-by-css">styled mode</a>, the stroke width is set in the <code>.highcharts-tooltip-box</code> class.</p>',
    'option.text.tooltip.borderRadius': 'Border corner radius',
    'option.tooltip.tooltip.borderRadius':
      'The radius of the rounded border corners.',
    'option.text.tooltip.borderColor': 'Border color',
    'option.tooltip.tooltip.borderColor':
      'The border color of the tooltip. If no color is given, the corresponding series color is used.',
    'option.text.exporting.enabled': 'Enable exporting',
    'option.tooltip.exporting.enabled':
      'Enable the context button on the top right of the chart, allowing end users to download image exports.',
    'option.text.exporting.sourceWidth': 'Exported width',
    'option.tooltip.exporting.sourceWidth':
      'The width of the original chart when exported. The pixel width of the exported image is then multiplied by the <em>Scaling factor</em>.',
    'option.text.exporting.scale': 'Scaling factor',
    'option.tooltip.exporting.scale':
      'The export scale. Note that this is overridden if width is set.',
    'option.text.exporting.offlineExporting': 'Offline Exporting',
    'option.tooltip.exporting.offlineExporting':
      'The offline-exporting module allows for image export of charts without sending data to an external server',
    'option.text.lang.decimalPoint': 'Decimal point',
    'option.tooltip.lang.decimalPoint':
      'The decimal point used for all numbers',
    'option.text.lang.thousandsSep': 'Thousands separator',
    'option.tooltip.lang.thousandsSep':
      'The thousands separator used for all numbers',
    'option.text.lang.contextButtonTitle': 'Context button title',
    'option.tooltip.lang.contextButtonTitle':
      'Exporting module menu. The tooltip title for the context menu holding print and export menu items.',
    'option.text.lang.printChart': 'Print chart',
    'option.tooltip.lang.printChart':
      'Exporting module only. The text for the menu item to print the chart.',
    'option.text.lang.downloadPNG': 'Download PNG',
    'option.tooltip.lang.downloadPNG':
      'Exporting module only. The text for the PNG download menu item.',
    'option.text.lang.downloadJPEG': 'Download JPEG',
    'option.tooltip.lang.downloadJPEG':
      'Exporting module only. The text for the JPEG download menu item.',
    'option.text.lang.downloadPDF': 'Download PDF',
    'option.tooltip.lang.downloadPDF':
      'Exporting module only. The text for the PDF download menu item.',
    'option.text.lang.downloadSVG': 'Download SVG',
    'option.tooltip.lang.downloadSVG':
      'Exporting module only. The text for the SVG download menu item.',
    'option.text.lang.resetZoom': 'Reset zoom button',
    'option.tooltip.lang.resetZoom':
      'The text for the label appearing when a chart is zoomed.',
    'option.text.credits.enabled': 'Enable credits',
    'option.tooltip.credits.enabled': 'Whether to show the credits text',
    'option.text.credits.text': 'Credits text',
    'option.tooltip.credits.text': 'The text for the credits label',
    'option.text.credits.href': 'Link',
    'option.tooltip.credits.href': 'The URL for the credits label'
  }
});
