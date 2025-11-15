/**
 * 绘制和编辑事件类型常量
 */

// 绘制事件
export const DrawStart = 'draw-start' // 开始绘制
export const DrawAddPoint = 'draw-add-point' // 绘制过程中增加了点
export const DrawRemovePoint = 'draw-remove-lastpoint' // 绘制过程中删除了last点
export const DrawMouseMove = 'draw-mouse-move' // 绘制过程中鼠标移动了点
export const DrawCreated = 'draw-created' // 创建完成

// 编辑事件
export const EditStart = 'edit-start' // 开始编辑
export const EditMovePoint = 'edit-move-point' // 编辑修改了点
export const EditRemovePoint = 'edit-remove-point' // 编辑删除了点
export const EditStop = 'edit-stop' // 停止编辑

// 删除事件
export const Delete = 'delete' // 删除对象
