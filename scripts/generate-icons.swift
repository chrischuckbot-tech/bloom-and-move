import AppKit

func makeIcon(size: Int, path: String) throws {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()

    NSColor(calibratedRed: 1.0, green: 0.973, blue: 0.949, alpha: 1).setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: size, height: size)).fill()

    let scale = CGFloat(size) / 512
    let center = NSPoint(x: 256 * scale, y: 266 * scale)
    let petalSize = NSSize(width: 154 * scale, height: 190 * scale)
    let petalRadius: CGFloat = 115 * scale
    let petalColor = NSColor(calibratedRed: 0.937, green: 0.486, blue: 0.459, alpha: 1)

    for index in 0..<5 {
        let angle = CGFloat(index) * (.pi * 2 / 5) + .pi / 2
        let petalCenter = NSPoint(
            x: center.x + cos(angle) * petalRadius,
            y: center.y + sin(angle) * petalRadius
        )
        let rect = NSRect(
            x: petalCenter.x - petalSize.width / 2,
            y: petalCenter.y - petalSize.height / 2,
            width: petalSize.width,
            height: petalSize.height
        )
        petalColor.setFill()
        NSBezierPath(ovalIn: rect).fill()
    }

    NSColor(calibratedRed: 0.388, green: 0.235, blue: 0.322, alpha: 1).setFill()
    NSBezierPath(ovalIn: NSRect(
        x: center.x - 104 * scale,
        y: center.y - 104 * scale,
        width: 208 * scale,
        height: 208 * scale
    )).fill()

    NSColor(calibratedRed: 0.976, green: 0.875, blue: 0.627, alpha: 1).setFill()
    NSBezierPath(ovalIn: NSRect(
        x: center.x - 36 * scale,
        y: center.y - 36 * scale,
        width: 72 * scale,
        height: 72 * scale
    )).fill()

    image.unlockFocus()

    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let png = bitmap.representation(using: .png, properties: [:]) else {
        throw NSError(domain: "BloomIcon", code: 1)
    }
    try png.write(to: URL(fileURLWithPath: path))
}

let root = FileManager.default.currentDirectoryPath
try makeIcon(size: 192, path: root + "/public/icon-192.png")
try makeIcon(size: 512, path: root + "/public/icon-512.png")
try makeIcon(size: 180, path: root + "/public/apple-touch-icon.png")
