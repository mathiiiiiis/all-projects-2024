import turtle
import re

screen = turtle.Screen()
screen.bgcolor("black")
artist = turtle.Turtle()
artist.speed(10)
artist.hideturtle()

user_input = ""

def draw_star():
    artist.penup()
    artist.goto(0, 0)
    artist.pendown()
    artist.color("yellow")
    artist.begin_fill()
    for _ in range(5):
        artist.forward(100)
        artist.right(144)
    artist.end_fill()

def draw_circle():
    artist.penup()
    artist.goto(0, -50)
    artist.pendown()
    artist.fillcolor("blue")
    artist.begin_fill()
    artist.circle(50)
    artist.end_fill()

def draw_shape(shape):
    if re.search(r"stern", shape, re.IGNORECASE):
        draw_star()
    elif re.search(r"kreis", shape, re.IGNORECASE):
        draw_circle()
    else:
        artist.penup()
        artist.goto(0, 0)
        artist.pendown()
        artist.color("white")
        artist.write("Erm whta tha sigma? ich frage mich witklich ob du lesen kannst", align="center", font=("Arial", 16, "normal"))

def update_input(char):
    global user_input
    user_input += char

def submit_input():
    global user_input
    artist.clear()
    draw_shape(user_input)
    user_input = ""

def clear_input():
    global user_input
    user_input = ""
    artist.clear()
    artist.penup()
    artist.goto(0, 50)
    artist.pendown()
    artist.color("white")
    artist.write("Was soll ich dir zeichnen? (Stern, Kreis)", align="center", font=("Arial", 16, "normal"))

def main():
    clear_input()
    screen.listen()
    
    screen.onkey(lambda: update_input(" "), "space")
    screen.onkey(submit_input, "Return")
    screen.onkey(clear_input, "c")
    
    def onkeypress(event):
        update_input(event.char)
        artist.clear()
        artist.penup()
        artist.goto(0, 50)
        artist.pendown()
        artist.color("white")
        artist.write("Was soll ich dir zeichnen? (Stern, Kreis)", align="center", font=("Arial", 16, "normal"))
        artist.goto(0, 0)
        artist.write(user_input, align="center", font=("Arial", 16, "normal"))

    screen.getcanvas().bind("<KeyPress>", onkeypress)

    turtle.done()

if __name__ == "__main__":
    main()
