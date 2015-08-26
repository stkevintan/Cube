/**
 * Created by kevin on 15-6-12.
 */
function SourceModel(raw) {
  this.type = raw.type || 0;
  this.name = raw.name || 'Unknown';
  this.entryList = raw.entryList || [];
  this.loader = raw.loader || function(callback) {
    callback(null, null);
  }
}
module.exports = SourceModel;
