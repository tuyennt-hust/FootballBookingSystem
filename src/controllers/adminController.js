const adminService = require('../services/adminService');
const { saveSession, setFlash } = require('../utils/session');

async function flashRedirect(req,res,next,action,successMessage,redirectTo){try{const value=await action();setFlash(req,'success',typeof successMessage==='function'?successMessage(value):successMessage);await saveSession(req);return res.redirect(redirectTo);}catch(error){if(error.status&&error.status<500){setFlash(req,'warning',error.message);await saveSession(req);return res.redirect(redirectTo);}return next(error);}}

module.exports={
 async status(req,res,next){try{return res.json({success:true,module:'admin',data:await adminService.getStatus()});}catch(e){return next(e);}},
 async dashboardPage(req,res,next){try{return res.render('admin/dashboard',{title:'Dashboard quản trị',pageDescription:'Tổng quan toàn hệ thống Football Booking.',...(await adminService.getDashboard(req.session.user))});}catch(e){return next(e);}},
 async accountsPage(req,res,next){try{return res.render('admin/accounts',{title:'Quản lý tài khoản',pageDescription:'Khóa, mở khóa và theo dõi tài khoản hệ thống.',...(await adminService.getAccounts(req.query,req.session.user))});}catch(e){return next(e);}},
 async setAccountStatus(req,res,next){return flashRedirect(req,res,next,()=>adminService.setAccountStatus(req.params.accountId,req.body.status,req.session.user),(a)=>`Đã chuyển ${a.ten_dang_nhap} sang ${a.statusMeta.label}.`,'/admin/tai-khoan');},
 async areasPage(req,res,next){try{return res.render('admin/areas',{title:'Quản lý khu vực',pageDescription:'Quản lý danh mục khu vực sân bóng.',...(await adminService.getAreas(req.session.user))});}catch(e){return next(e);}},
 async createArea(req,res,next){return flashRedirect(req,res,next,()=>adminService.createArea(req.body,req.session.user),(a)=>`Đã thêm khu vực ${a.ten_khu_vuc} (${a.ma_khu_vuc}).`,'/admin/khu-vuc');},
 async updateArea(req,res,next){return flashRedirect(req,res,next,()=>adminService.updateArea(req.params.areaId,req.body,req.session.user),(a)=>`Đã cập nhật khu vực ${a.ten_khu_vuc}.`,'/admin/khu-vuc');},
 async deleteArea(req,res,next){return flashRedirect(req,res,next,()=>adminService.deleteArea(req.params.areaId,req.session.user),(a)=>`Đã xóa khu vực ${a.ten_khu_vuc}.`,'/admin/khu-vuc');},
 async pitchesPage(req,res,next){try{return res.render('admin/pitches',{title:'Toàn bộ sân bóng',pageDescription:'Theo dõi sân bóng của tất cả chủ sân.',...(await adminService.getPitches(req.query,req.session.user))});}catch(e){return next(e);}},
 async bookingsPage(req,res,next){try{return res.render('admin/bookings',{title:'Toàn bộ đơn đặt sân',pageDescription:'Theo dõi trạng thái đặt sân trên toàn hệ thống.',...(await adminService.getBookings(req.query,req.session.user))});}catch(e){return next(e);}},
 async invoicesPage(req,res,next){try{return res.render('admin/invoices',{title:'Toàn bộ hóa đơn',pageDescription:'Theo dõi hóa đơn và tình trạng thanh toán.',...(await adminService.getInvoices(req.query,req.session.user))});}catch(e){return next(e);}},
 async statisticsPage(req,res,next){try{return res.render('admin/statistics',{title:'Báo cáo và thống kê',pageDescription:'Các chỉ số doanh thu và hành vi sử dụng hệ thống.',...(await adminService.getStatistics(req.session.user))});}catch(e){return next(e);}},
 async apiDashboard(req,res,next){try{return res.json({success:true,data:await adminService.getDashboard(req.session.user)});}catch(e){return next(e);}},
 async apiAccounts(req,res,next){try{return res.json({success:true,data:await adminService.getAccounts(req.query,req.session.user)});}catch(e){return next(e);}},
 async apiSetAccountStatus(req,res,next){try{return res.json({success:true,data:await adminService.setAccountStatus(req.params.accountId,req.body.status,req.session.user)});}catch(e){return next(e);}},
 async apiAreas(req,res,next){try{return res.json({success:true,data:await adminService.getAreas(req.session.user)});}catch(e){return next(e);}},
 async apiCreateArea(req,res,next){try{return res.status(201).json({success:true,data:await adminService.createArea(req.body,req.session.user)});}catch(e){return next(e);}},
 async apiUpdateArea(req,res,next){try{return res.json({success:true,data:await adminService.updateArea(req.params.areaId,req.body,req.session.user)});}catch(e){return next(e);}},
 async apiDeleteArea(req,res,next){try{return res.json({success:true,data:await adminService.deleteArea(req.params.areaId,req.session.user)});}catch(e){return next(e);}},
 async apiPitches(req,res,next){try{return res.json({success:true,data:await adminService.getPitches(req.query,req.session.user)});}catch(e){return next(e);}},
 async apiBookings(req,res,next){try{return res.json({success:true,data:await adminService.getBookings(req.query,req.session.user)});}catch(e){return next(e);}},
 async apiInvoices(req,res,next){try{return res.json({success:true,data:await adminService.getInvoices(req.query,req.session.user)});}catch(e){return next(e);}},
 async apiStatistics(req,res,next){try{return res.json({success:true,data:await adminService.getStatistics(req.session.user)});}catch(e){return next(e);}},
};
