var Table = function (sheet) {
	this.sheet = sheet;
	this.headers = this.getHeaders();
	};
	
	/**
	 * Returns an array of values from header row, which is either the first row or last frozen row
	 * @returns {Array}
	 */
	Table.prototype.getHeaders = function () {
		var headerRow = this.sheet.getFrozenRows();
		headerRow = headerRow > 0 ? headerRow : 1;
		var headers = this.sheet.getRange( headerRow, 1, 1, this.sheet.getLastColumn()).getValues()[0];
		
		return headers;
	};
	
	Table.prototype.getColumnForHeader = function (headerName) {
		var index = this.headers.indexOf(headerName);
		if( index > 0 ) {
			return index + 1;
		} else {
			return null;
		}
	}
	
	/**
	 * Gives index of first row after header row
	 * @returns {Integer}
	 */
	Table.prototype.firstRecordIndex = function () {
		var headerRow = this.sheet.getFrozenRows();
		headerRow = headerRow > 0 ? headerRow : 1;
		return headerRow + 1;
	}
	
	/**
	 * Check if given range falls within existing records
	 * @returns {Boolean}
	 */
	Table.prototype.withinRecordRange = function (range) {
		var rowIndex = range.getRow();
		
		if( rowIndex >= this.firstRecordIndex() && rowIndex + range.getHeight() - 1 <= this.sheet.getLastRow() ) {
			return true;
		}	else {
			return false;
		}
	}
	
	/**
	 * Convert a range to a range of complete rows
	 * @param {Range} Range to convert
	 * @returns {Range}
	 */
	Table.prototype.convertRangeToRowRange = function (range) {
		var startRow = range.getRow();
		
		//Ignore header rows (Frozen)
		startRow = startRow < this.firstRecordIndex() ? this.firstRecordIndex() : startRow;
		
		return this.sheet.getRange( startRow, 1,range.getHeight(), this.sheet.getLastColumn() );
	}
	
	/**
	 * Make a range of complete rows from a start row and number of rows
	 * @param {Range} Row at start of range
	 * @param {Range} Number of rows in range
	 * @returns {Range}
	 */
	Table.prototype.getRangeForRows = function (rowIndex, numRows) {
		return this.sheet.getRange(rowIndex, 1, numRows, this.sheet.getLastColumn() );
	}
	
	/**
	 * Make a record object from headers and value of data array
	 * @param {Array} Array containing a row of data
	 * @returns {Object}
	 */
	Table.prototype.makeRecord = function (dataArray, rowIndex) {
		var record = null;
		
		if( dataArray != null && dataArray.length == this.headers.length ) {
			record = {};
			record["rowIndex"] = rowIndex;
			this.headers.forEach( function (key, index) {
			if(key != "") {
				record[key]	= dataArray[index];
			}
			});
		} else {
			Logger.log("Error: dataArray either null or does not match length of headers"); 
		}
		
		return record;
	};
	
	/**
	 * Return an array of record objects from a given range
	 * @param {Range} Range of rows to get
	 * @returns {Array}
	 */
	Table.prototype.getRecords = function (range) {
		var startRow = range.getRow();
		var rowRange = this.convertRangeToRowRange( range );
		
		var values = rowRange.getValues();
		
		var records = [];
		var table = this;
		
		values.forEach( function (row, index) {
			var record = table.makeRecord(row, index + startRow);
			if( record != null ) {
			records.push( record );
			} else {
			Logger.log("Ignoring row " + index + startRow); 
			}
		});
		
		return records;
	};
	
	/**
	 * Return an array of record objects for all rows
	 */
	Table.prototype.getAllRecords = function () {
		var rowIndex = this.firstRecordIndex(); 
		var range = this.sheet.getRange(rowIndex, 1, this.sheet.getLastRow(), this.sheet.getLastColumn() );
		
		return this.getRecords(range);
	}
	
	/** 
	 *	Add a list of records to a sheet.
	 */
	Table.prototype.addRecords = function (records) {
		var headers = this.headers;
		var theSheet = this.sheet;
		
		records.forEach( function (record) {
			var row = headers.map( function (header) {
			if( record[header] != null ) {
				return record[header];
			} else {
				return "";
			}
			});
			theSheet.appendRow(row)
		});	
	};
	
	/**
	 *	Delete records (rows) from a sheet.
	 */
	Table.prototype.deleteRecords = function (range) {
		if( this.withinRecordRange(range) ) {
			this.sheet.deleteRows( range.getRow(),	range.getHeight() );
		} else {
			Logger.log("Row " + range.getRow()	+ " not in range")
		} 
	};
	
	/**
	 *	
	 */
	Table.prototype.updateRecord = function (rowIndex, record) {
		var range = this.getRangeForRows(rowIndex, 1);
		
		var row = this.headers.map( function (header) {
			return record[header];
		});
		
		range.setValues([row]);
	};