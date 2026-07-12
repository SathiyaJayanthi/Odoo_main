from accounts.models import User

emails = ['fleet_manager@demo.com','driver@demo.com','safety_officer@demo.com','financial_analyst@demo.com']
for e in emails:
    u = User.objects.filter(email=e).first()
    if u:
        u.set_password('demopass123')
        u.save()
        print('reset', e)
    else:
        print('missing', e)
