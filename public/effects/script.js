var loadHucCong = false;
if (window.sessionStorage){
    var data = sessionStorage.getItem('time_load_gpmn');
    if (data) loadHucCong = false;
    else loadHucCong = true;
}
document.addEventListener("DOMContentLoaded", function() {
  if (!loadHucCong) return;
  var body = document.body;
  var elemDiv = document.createElement('div');
  elemDiv.setAttribute('id','gpmn-body-load')
  elemDiv.innerHTML=`<div class="bl-logo">
          <div class="tank-wrap">
              <div class="vn-sun"><img src="https://api.cmsnt.co/cdn/3041975/img/vn-flag-full.gif" /></div>
              <div class="tank-simu">
                  <div class="wheels"><span></span><span></span><span></span><span></span><span></span></div>
                  <div class="fence"></div>
                  <div class="fence2"></div>
              </div>
              <div class="gate"></div>
              <div class="gate2"></div>
          </div>
          <div class="text-h1 text-center">Chào Mừng 50 Năm Thống Nhất Đất Nước 30/04/1975 - 30/04/2025</div>
      </div>`;
  document.body.appendChild(elemDiv);
  setTimeout(function() {
          document.getElementById('gpmn-body-load').style.display = 'none';
      }, 3100);
  if (window.sessionStorage){
   sessionStorage.setItem('time_load_gpmn', 1);
  }
});