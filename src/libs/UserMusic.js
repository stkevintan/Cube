var Model = require('./Model');
var Storage = require('./Storage');
var st = new Storage();
var um = {};
function pack(entryList){
  return entryList.map(function(entry){
    return new Model.entry(entry);
  });
}
um.get = function(cb){
  process.nextTick(function(){
    var entryList = pack(st.get('scheme')) || new EntryM({
      name:'正在播放',
      creator:process.env.USER
    });
    cb(entryList);
  });
}
