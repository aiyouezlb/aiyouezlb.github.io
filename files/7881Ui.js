
$("select[name='items']").change(function(){
	$("#selVal").text('【'+$("select[name='items']").val()+'】');
});	
$(".cutover li").click(function(){
	$(".cutover li").removeClass("selected");
	$(".cutover li i").remove();
	$(this).parent().parent().find("li").removeClass("selected");
	$(this).addClass("selected");
	$(this).append("<i></i>");
});
$(".tab").next().children().not(".showOne").hide();
	$(".tab li a").click(function() {
		$(this).parent().parent().children().removeClass("current");
		$(this).parent().addClass("current");
		var tabindex = ($(this).parent().parent().find("li a").index($(this)));
		var nextdiv = $(this).parent().parent().next();
		$(nextdiv.children()).hide();
		$(nextdiv.children().get(tabindex)).show();
});