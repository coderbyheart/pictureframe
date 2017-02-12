export const viewBox = (photoWidth, photoHeight, viewBoxWidth, viewBoxHeight) => {
  const scaleWidth = viewBoxWidth / photoWidth
  const scaleHeight = viewBoxHeight / photoHeight
  const w = photoWidth * scaleWidth
  let h = Math.min(viewBoxHeight, photoHeight * scaleWidth)
  if (h < viewBoxHeight) {
    return viewBoxVertical(photoWidth, photoHeight, viewBoxWidth, viewBoxHeight)
  }
  if (scaleWidth > scaleHeight) {
    h = photoHeight * scaleWidth
  }
  return {
    width: w,
    height: h,
    left: viewBoxWidth - w,
    top: viewBoxHeight - h
  }
}

const viewBoxVertical = (photoWidth, photoHeight, viewBoxWidth, viewBoxHeight) => {
  const scaleHeight = viewBoxHeight / photoHeight
  let h = photoHeight * scaleHeight
  let w = photoWidth * scaleHeight
  return {
    width: w,
    height: h,
    left: viewBoxWidth - w,
    top: viewBoxHeight - h
  }
}
