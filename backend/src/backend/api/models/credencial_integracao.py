from tortoise import fields, models

class CredencialIntegracao(models.Model):
    id = fields.IntField(pk=True)
    access_token = fields.CharField(null=False, max_length=255)
    refresh_token = fields.CharField(null=False, max_length=255)
    data_expiracao = fields.DatetimeField(null=True)
    
    organizacao = fields.ForeignKeyField(
        'models.Organizacao', 
        related_name='credenciais_integracao',
        on_delete=fields.CASCADE
    )
    integracao = fields.ForeignKeyField(
        'models.Integracao', 
        related_name='credenciais_integracao',
        on_delete=fields.CASCADE
    )

    class Meta:
        table = "credencial_organizacao_integracao"
