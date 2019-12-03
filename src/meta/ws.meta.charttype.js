

// @format

ws.meta.charttype = {
    arearange: {
        'low': {
            'name': "Low",
            'desc': 'The low or minimum value for each data point.',
            'default': 'B',
            'value': 'B',
            'mandatory': true,
            'linkedTo': 'low',
            'rawValue': [1]
        }, 
        'values': null,
        'high': {
            'name': "High",
            'desc': 'The high or maximum value for each data point.',
            'default': 'C',
            'value': 'C',
            'isData': true,
            'mandatory': true,
            'linkedTo': 'high',
            'rawValue': [2]
        }
    },
    boxplot: {
        'low': {
            'name': "Low",
            'desc': 'The low value for each data point, signifying the lowest value in the sample set. The bottom whisker is drawn here.',
            'default': 'B',
            'value': 'B',
            'isData': true,
            'mandatory': true,
            'linkedTo': 'low',
            'rawValue': [1]
        }, 
        'values': null,
        'high': {
            'name': "High",
            'desc': 'The rank for this points data label in case of collision. If two data labels are about to overlap, only the one with the highest labelrank will be drawn.',
            'default': 'C',
            'value': 'C',
            'isData': true,
            'mandatory': true,
            'linkedTo': 'high',
            'rawValue': [2]
        }, 
        'median': {
            'name': "Median",
            'desc': 'The median for each data point. This is drawn as a line through the middle area of the box.',
            'default': 'D',
            'value': 'D',
            'mandatory': true,
            'isData': true,
            'linkedTo': 'median',
            'rawValue': [3]
        }, 
        'q1': {
            'name': "Q1",
            'desc': 'The lower quartile for each data point. This is the bottom of the box.',
            'default': 'E',
            'value': 'E',
            'mandatory': true,
            'multipleValues': false,
            'isData': true,
            'previousValue': null,
            'linkedTo': 'q1',
            'rawValue': [4]
        }, 
        'q3': {
            'name': "Q3",
            'desc': 'The higher quartile for each data point. This is the top of the box.',
            'default': 'F',
            'value': 'F',
            'mandatory': true,
            'isData': true,
            'linkedTo': 'q3',
            'rawValue': [4]
        }
    },
    candlestick: {
        'values': null,
        'close': {
            'name': "Close",
            'desc': 'The closing value of each data point.',
            'default': 'B',
            'value': 'B',
            'mandatory': true,
            'linkedTo': 'close',
            'isData': true,
            'rawValue': [1]
        }, 
        'open': {
            'name': "Open",
            'desc': 'The opening value of each data point.',
            'default': 'C',
            'value': 'C',
            'mandatory': true,
            'isData': true,
            'linkedTo': 'open',
            'rawValue': [2]
        }, 
        'low': {
            'name': "Low",
            'desc': 'The low or minimum value for each data point.',
            'default': 'D',
            'value': 'D',
            'multipleValues': false,
            'previousValue': null,
            'mandatory': true,
            'isData': true,
            'linkedTo': 'low',
            'rawValue': [3]
        }, 
        'high': {
            'name': "High",
            'desc': 'The high or maximum value for each data point.',
            'default': 'E',
            'value': 'E',
            'mandatory': true,
            'isData': true,
            'linkedTo': 'high',
            'rawValue': [4]
        }
    },
    bubble: {
        'values': null,
        'y': {
            'name': "Y",
            'desc': 'Y Position',
            'default': 'B',
            'value': 'B',
            'mandatory': true,
            'isData': true,
            'linkedTo': 'y',
            'rawValue': [1]
        },
        'z': {
            'name': "Z",
            'desc': 'Z Position.',
            'default': 'C',
            'value': 'C',
            'mandatory': true,
            'isData': true,
            'linkedTo': 'z',
            'rawValue': [2]
        }
    },
    columnrange: {
        'values': null,
        'low': {
            'name': "Low",
            'desc': 'The low or minimum value for each data point.',
            'default': 'B',
            'value': 'B',
            'mandatory': true,
            'isData': true,
            'linkedTo': 'low',
            'rawValue': [1]
        },
        'high': {
            'name': "High",
            'desc': 'The high or maximum value for each data point.',
            'default': 'C',
            'value': 'C',
            'mandatory': true,
            'isData': true,
            'linkedTo': 'high',
            'rawValue': [2]
        }
    },
};
